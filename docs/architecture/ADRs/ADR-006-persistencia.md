# ADR-006 — Persistência: banco de dados, migrações e ordem de implementação

**Estado:** Aprovada em 25/11/2026 (DEC-062) nos quatro pontos pendentes: persistência local liberada, dependência Prisma, scrypt mantido e ausência de dados reais em `.data/accounts.json`. Não decide o provedor de hospedagem (continua na ADR-003, em revisão) nem o provedor Pix (ADR-005).
**Data:** 2026-11-25
**Responsável pela decisão:** responsável pelo projeto, a partir de recomendação técnica
**Relacionados:** PRD 2.7 §16, §18.3, §24; DEC-023, DEC-047, DEC-051, DEC-053, DEC-061; [ADR-001](ADR-001-sessoes-e-tentativas-de-login.md); [ADR-002](ADR-002-atualizacao-em-tempo-real.md); [ADR-003](ADR-003-infraestrutura.md); [ADR-005](ADR-005-provedor-de-pagamento-pix.md); [`database/schema.sql`](../../../database/schema.sql) 0.9; backlog Épico 1 e itens 3.5, 7.1 e 7.2

## Contexto

Hoje `app/` não tem banco (DEC-053):

- **Contas** (cliente e batedeira) ficam em `.data/accounts.json`, em arquivo, de uma instância, e **não duram em contêiner**. A equipe (administrador e operadores iniciais) vem da variável `STAFF_ACCOUNTS`, com hash scrypt.
- **Sessão** é um cookie assinado (HMAC), sem estado no servidor; a **limitação de tentativas** fica em memória.
- **Pedidos, catálogo, cobertura e horários** ficam no navegador de cada pessoa. Por isso um pedido feito por um cliente **não aparece** para a batedeira: sem banco, o produto não funciona com mais de um usuário.
- Não há estorno, contestação, eventos de webhook nem trilha de auditoria; o schema 0.9 já tem tudo isso.

A DEC-023 fixou MySQL e Prisma. A DEC-061 manteve a persistência bloqueada até as ADRs de provedor Pix e de persistência serem aprovadas. Nenhum dado real existe: as contas em arquivo são de desenvolvimento (premissa a confirmar), então **não há migração de dados**.

## Decisão proposta

1. **Banco:** MySQL 8.0+ (DEC-023), estrutura oficial em `database/schema.sql`, que continua sendo a única fonte da estrutura (README, DEC-061).
2. **Acesso e migrações:** Prisma Client para consultas e **Prisma Migrate com migrações em SQL**. A migração 0001 é uma cópia exata de `schema.sql`; migrações seguintes são SQL escrito à mão, versionado e, quando viável, reversível (AGENTS.md). O `schema.prisma` é gerado por introspecção (`prisma db pull`) e não é editado à mão. Prisma não representa as restrições `CHECK` nem os índices parciais; por isso o SQL é a fonte, e a aplicação valida as mesmas regras (AGENTS.md: "validar entradas em todas as fronteiras"). Um teste automatizado compara o banco criado pelas migrações com o criado por `schema.sql` (a versão anterior do projeto já fazia isso, no histórico do Git).
3. **Desenvolvimento local:** MySQL 8.0 em Docker, sem depender de provedor (DEC-051). **Esta ADR propõe liberar já o desenvolvimento da persistência apenas em ambiente local**, com a hospedagem e o provedor Pix ainda abertos: o código só exige MySQL e variáveis de ambiente, é portátil entre provedores (ADR-003, item 6) e o Épico 9 (pagamento) entra depois da ADR-005. Deploy em homologação e produção continua bloqueado pela ADR-003. Aprovar esta ADR **revoga o bloqueio da persistência** da DEC-061 apenas no ambiente local.
4. **Dinheiro e identificadores:** centavos em inteiro (`BIGINT`/`INT`), sem ponto flutuante; datas em UTC no banco, exibidas no fuso de Cametá (`America/Belem`); identificadores `BIGINT` do schema, com código público do pedido separado (`AC-…`), como já faz `createOrderId`.
5. **Transações e concorrência (backlog 7.1):** toda transição de estado do pedido é **uma transação** que lê o estado atual com bloqueio de linha (`SELECT … FOR UPDATE`), valida a transição na máquina de estados (`applyTransition`, hoje em `app/lib/domain.ts`, movida para um módulo de domínio sem dependência de interface) e grava o novo estado e o evento em `eventos_pedido`. A **idempotência** de criação de pedido (3.5) é a restrição `uq_pedidos_cliente_idempotencia`, não uma checagem em memória. Eventos de webhook usam a unicidade de `eventos_webhook` (ADR-005).
6. **Autorização e sessão:** a ADR-001 passa a ser implementada: sessão opaca em `sessoes` (hash SHA-256 do token, 30 dias para cliente e 12 horas para equipe) e `tentativas_login` por e-mail e por origem. O cookie assinado e a limitação em memória de `app/lib/staff-auth.ts` são **removidos** quando isso entrar. As contas da equipe saem de `STAFF_ACCOUNTS` para a tabela `usuarios`, criadas por script (`pnpm acesso:gerar` passa a gravar no banco), e a variável deixa de existir.
7. **Hash de senha:** manter **scrypt** (módulo `node:crypto`, já em uso, sem dependência nativa) em vez de argon2id ou bcrypt, que a ADR-001 e o backlog 7.2 citam. Scrypt é um algoritmo lento adequado para senhas; a escolha evita uma dependência e preserva o código testado. Se aprovada, a ADR-001 (item 6), a arquitetura §7 e o backlog 7.2 passam a dizer "scrypt, argon2id ou bcrypt". **Parâmetros atuais:** N=16384, r=8, p=1; revisar antes do piloto contra a recomendação vigente da OWASP, que é mais exigente (a conferir).
8. **Dados pessoais:** só o necessário (PRD §17). O CPF/CNPJ da batedeira fica em `batedeiras.documento` e só o administrador o vê, mascarado; o banco nunca é lido por logs ou fixtures. Retenção e anonimização seguem a DEC-047 (provisória). **Criptografia do documento em repouso** não está decidida: o banco gerenciado já cifra o disco (a confirmar na ADR-003); cifrar a coluna na aplicação é uma opção a decidir antes do piloto, com a política de privacidade.
9. **Expiração de pedidos:** hoje roda no cliente e no servidor sem agendador. Com banco, a expiração é uma tarefa periódica no processo da aplicação (ou agendador do provedor), que usa a mesma transação do item 5. É requisito da ADR-003 que o processo fique vivo.
10. **Backup e restauração (backlog 1.6):** backup automático diário e teste de restauração documentado antes do piloto. Depende do provedor (ADR-003); a ADR deste ponto é só o requisito.
11. **Fotos:** continuam fora do banco (nunca blob). O armazenamento de objetos é decidido na ADR-003; até lá o envio de fotos em produção segue desligado.

## Ordem de implementação (andamento)

- **Etapa 1 — concluída em 25/11/2026:** Prisma, MySQL local em Docker, migração 0001, semeador de bairros.
- **Etapa 2 — concluída em 25/11/2026:** contas, sessões, tentativas de login e redefinição de senha no banco (migração 0002 e schema 0.10, tabela `redefinicoes_senha`); `accounts-store.ts`, `STAFF_ACCOUNTS` e o cookie assinado foram removidos; administrador por `pnpm acesso:criar`.
- **Etapa 3 — concluída em 25/11/2026:** batedeiras, produtos, bairros atendidos (taxa e faixa), horários e situação no banco; ativação pelo administrador com auditoria; `GET /api/catalogo`, `PUT /api/operador/loja`, `POST /api/operador/produtos`, `POST /api/admin/batedeiras/situacao`. Fotos ficam desligadas até o armazenamento (ADR-003).
- **Etapa 4 — concluída em 25/11/2026:** pedidos no banco (`lib/orders.ts`): criação com preço, taxa e total recalculados no servidor e idempotência pela restrição do banco; transições, escolha do pagamento (só dinheiro; Pix recusado até a ADR-005), mensagens e intervenções em transação com `SELECT ... FOR UPDATE`; expiração automática a cada 10 s (`instrumentation.ts`) e ao listar; `GET/POST /api/pedidos` e `POST /api/pedidos/[codigo]/(transicao|pagamento|mensagem)`; schema 0.11 (`pedidos.telefone_snapshot`, migração 0003). Atualização por consulta a cada 5 s até o SSE (etapa 6).
- Etapas 5 a 7: pendentes.

Detalhe de cada etapa:

Cada etapa é pequena, com testes, e só começa quando a anterior está verde. Nenhuma depende do provedor Pix.

1. **Fundação:** Prisma, Docker Compose do MySQL local, migração 0001 (= `schema.sql`), teste de sincronia, `seed` de bairros (13) e acesso ao banco por um módulo de infraestrutura isolado.
2. **Contas e sessões:** `usuarios`, `batedeiras`, `enderecos_clientes`, `sessoes`, `tentativas_login`; cadastro, login e redefinição de senha saem de `accounts-store.ts` e `staff-auth.ts`; equipe por script. Testes de autorização por papel.
3. **Catálogo e cobertura:** produtos, horários, bairros e taxas por batedeira, no servidor.
4. **Pedido:** criação idempotente, aceite, recusa, cancelamento, expiração, `AGUARDANDO_PAGAMENTO` e estados terminais, com `eventos_pedido`; dinheiro na entrega ponta a ponta. A interface passa a consultar o servidor em vez do navegador.
5. **Administração:** ativação e suspensão com `eventos_auditoria`, consulta de pedidos, métricas.
6. **Tempo real (ADR-002):** SSE sobre `eventos_pedido`, com consulta periódica como contingência.
7. **Pagamento:** só depois da ADR-005 aprovada (Épico 9).

## Alternativas consideradas

- **PostgreSQL.** Descartada: a DEC-023 fixou MySQL, o schema 0.9 está validado em MySQL 8.0 e mudar exige reescrever o schema sem ganho no piloto.
- **Gerar o banco a partir do `schema.prisma` (sem SQL à mão).** Descartada: perderia `CHECK`, índices e a constraint de idempotência, que o schema usa como defesa de integridade.
- **ORM diferente ou SQL puro.** Descartada: a DEC-023 fixou Prisma; SQL puro fica para consultas específicas dentro do mesmo módulo.
- **SQLite local para desenvolvimento.** Descartada: diverge do comportamento de bloqueio e de `CHECK` do MySQL; o Docker já resolve o ambiente local.
- **Manter o arquivo `accounts.json` até a hospedagem.** Descartada: não é durável, não suporta concorrência e impede a ADR-001.

## Consequências

- `app/` ganha dependências: `prisma` e `@prisma/client` (e o driver MySQL que o Prisma escolher). É a única dependência nova proposta; **exige aprovação** (AGENTS.md).
- A interface muda de dados no navegador para chamadas ao servidor; é a maior parte do trabalho das etapas 3 a 5 e exige novos testes de autorização e de estados do pedido.
- Os 47 testes atuais cobrem regras de domínio que serão movidas, não reescritas; os testes de integração passam a exigir um MySQL local.
- Cada alteração de schema passa a exigir migração e atualização do dicionário de dados (AGENTS.md).
- A ADR-003 deixa de precisar tratar persistência de aplicação; resta nela região, MySQL gerenciado, backup e arquivos.

## Pendências e riscos

- **Confirmar:** que nenhum dado real existe hoje em `.data/accounts.json` (premissa de "sem migração de dados").
- **Aprovar:** a dependência Prisma; liberar a persistência local; scrypt no lugar de argon2id/bcrypt.
- **Decidir antes do piloto:** cifrar ou não o CPF/CNPJ em repouso; parâmetros do scrypt; política de privacidade (DEC-047).
- **Risco:** com a persistência local liberada e a hospedagem ainda aberta, a escolha posterior do provedor pode exigir ajustes (por exemplo, TLS no banco e limites de conexão). Mitigação: usar só MySQL padrão e variáveis de ambiente.
