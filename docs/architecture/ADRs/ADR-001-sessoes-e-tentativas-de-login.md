# ADR-001 — Sessões e tentativas de login persistidas no banco

**Estado:** Aceita
**Data:** 2026-09-28
**Responsável pela decisão:** responsável pelo projeto, a partir de recomendação técnica
**Relacionados:** PRD 2.6 §16.2 e §17; DEC-023; DEC-035; [`database/schema.sql`](../../../database/schema.sql) 0.7; [arquitetura técnica proposta](../../product/arquitetura-tecnica.md) §7

## Contexto

O PRD §16.2 exige limitação de tentativas de login, encerramento de sessões e bloqueio de conta. O schema 0.5 não tinha onde guardar sessões nem tentativas, e a arquitetura proposta deixava a estratégia como decisão de engenharia pendente.

O MVP é um monólito Next.js com MySQL (DEC-023). O banco é o único armazenamento persistente previsto. Em hospedagens com várias instâncias ou funções sem estado, a memória do processo não é compartilhada nem sobrevive a reinícios.

## Decisão

1. **Sessão opaca no banco.** O login gera um token aleatório de alta entropia, sempre novo a cada login, enviado ao navegador em cookie `httpOnly`, `Secure` e `SameSite=Lax`. O banco guarda somente o hash SHA-256 do token (`sessoes.token_hash`), nunca o token em si.
2. **Duração da sessão.** A sessão do cliente vale 30 dias e é renovada a cada uso (`sessoes.expira_em` é estendido). A sessão de operador e de administrador vale 12 horas a partir do login, sem renovação.
3. **Encerramento de sessão.** Sair da conta preenche `sessoes.encerrada_em`. Bloquear ou desativar uma conta encerra, na mesma transação, todas as sessões ativas do usuário. Cada requisição autenticada rejeita sessão encerrada, expirada ou de usuário que não esteja `ATIVO`.
4. **Limitação de tentativas por conta e por origem.** Cada tentativa de login grava o e-mail normalizado, o hash da origem, se teve sucesso e o horário (`tentativas_login`). Antes de verificar a senha, a aplicação conta as falhas dos últimos 15 minutos:
   - **por e-mail**, com espera crescente: a partir de 10 falhas, 1 minuto; a partir de 15, 5 minutos; a partir de 20, 15 minutos;
   - **por origem**, com limite de 50 falhas em 15 minutos, que resulta em 15 minutos de espera. O limite é alto de propósito: operadoras móveis compartilham um mesmo IP entre muitos clientes (CGNAT), e um limite baixo bloquearia usuários legítimos.
5. **Respostas que não revelam contas.** A resposta é igual para e-mail inexistente, senha errada e tentativa em espera. Quando o e-mail não existe, a aplicação calcula mesmo assim um hash de senha, para que o tempo de resposta não revele quais e-mails têm conta.
6. **Senhas.** A senha é guardada com algoritmo lento (argon2id ou bcrypt), exige no mínimo 8 caracteres e é recusada quando consta em lista de senhas comuns ou vazadas, conforme o NIST SP 800-63B.
7. **Minimização.** `tentativas_login` não guarda o IP em texto, o navegador nem a senha digitada. A origem é guardada como HMAC-SHA-256 do IP com um segredo do servidor; um hash simples seria reversível, porque o número de endereços IPv4 é pequeno. Os registros são expurgados após 24 horas. Sessões encerradas ou expiradas são removidas por rotina periódica.

Os valores acima são configuráveis e podem ser ajustados na especificação de engenharia ou a partir do comportamento observado no piloto, sem mudar esta decisão.

## Alternativas consideradas

- **Token autocontido (JWT) sem estado no servidor.** Descartada: não permite encerrar uma sessão de imediato, o que o bloqueio de conta exige.
- **Armazenamento em memória ou cache externo (ex.: Redis).** Descartada: a memória não é compartilhada entre instâncias, e um serviço de cache seria mais uma dependência sem necessidade no volume do piloto.
- **Provedor de identidade terceirizado.** Descartada, como já indicava a arquitetura proposta: o piloto não justifica a dependência, e a recuperação de acesso já é assistida pelo administrador.

## Consequências

- O schema passou para a versão 0.6, com as tabelas `sessoes` e `tentativas_login`, e para a 0.7, com a coluna `tentativas_login.origem_hash`. O dicionário de dados, o MER e o modelo `database/acai_conecta.mwb` foram atualizados.
- Cada requisição autenticada faz uma consulta indexada por `token_hash`, custo desprezível no volume do piloto.
- A limitação por origem contém tentativas distribuídas entre muitos e-mails, mas não ataques vindos de muitas origens diferentes. Se o piloto indicar esse risco, a resposta deverá ser reavaliada.
- A espera por e-mail permite que alguém atrase o login de outra pessoa errando a senha de propósito. A espera crescente e curta limita esse efeito a no máximo 15 minutos por vez.
- O segredo usado no HMAC da origem é uma variável privada do servidor e nunca é versionado.
- As rotinas de expurgo precisam de execução periódica, a definir junto com o mecanismo de expiração de pedidos.

## Histórico

- 2026-09-28 (primeira versão): aceita com a proposta de 5 falhas por e-mail em 15 minutos, 15 minutos de espera e sem limitação por origem.
- 2026-09-28 (revisão): revisada a pedido do responsável pelo projeto, conforme boas práticas (NIST SP 800-63B, OWASP): limite por e-mail elevado a 10 falhas com espera crescente, limitação por origem com IP guardado como HMAC, duração das sessões, token novo a cada login, regra mínima de senha e proteção contra descoberta de contas pelo tempo de resposta.
