# AçaíConecta — aplicação web

Aplicação web (Next.js, React, TypeScript e Tailwind CSS) para conectar consumidores às batedeiras de açaí tradicional de Cametá/PA. Cobre as áreas do cliente, da batedeira (operador) e da administração.

## Requisitos

Node.js 24 e pnpm compatível com o lockfile.

## Execução local

Requer Docker com Compose (MySQL local, ADR-006 e DEC-062).

```sh
cd app
pnpm install --frozen-lockfile
cp .env.example .env         # preencha SESSION_SECRET (openssl rand -hex 32) e as senhas do MySQL (openssl rand -hex 16);
                             # DATABASE_URL = mysql://acai:<MYSQL_PASSWORD>@127.0.0.1:3306/acai_conecta?allowPublicKeyRetrieval=true
                             # sem o parâmetro, a conexão falha depois que o MySQL reinicia; só para o banco local (em produção, TLS)
pnpm db:subir                # MySQL 8 em 127.0.0.1:3306, com volume persistente
pnpm db:migrar               # aplica prisma/migrations (equivalem a database/schema.sql)
pnpm db:semear               # 13 bairros urbanos (idempotente)
pnpm dev                     # http://localhost:3000
```

Verificações: `pnpm typecheck`, `pnpm test` (sem banco), `pnpm test:db` (exige o MySQL local migrado e semeado) e `pnpm build`. Não há script de lint. O mesmo `.env` serve ao Compose, ao Prisma, aos scripts e ao Next.js.

## Banco de dados (ADR-006, DEC-062)

Etapa 4 de 7 concluída: **contas, sessões, batedeiras, catálogo, bairros, horários e agora os pedidos** (criação idempotente, aceite, recusa, cancelamento, escolha do pagamento em dinheiro, preparo, entrega, falha, expiração automática, mensagens e intervenções) usam o MySQL. Só a sacola, os endereços salvos, o contato de suporte e o bloqueio/recuperação de acesso de clientes ainda ficam no navegador (etapa 5 e seguintes). A tela atualiza os pedidos a cada 5 segundos; o tempo real por SSE é a etapa 6. Só para desenvolvimento local: não há hospedagem.

A estrutura vem de `database/schema.sql` (versão completa e atual); as migrações em `prisma/migrations` são incrementais e, somadas, equivalem a ele, o que um teste confere. `prisma/schema.prisma` é gerado por `pnpm db:introspectar` e não se edita à mão; o cliente gerado fica em `lib/generated` (fora do Git, recriado por `pnpm install`). Para mudar o modelo: crie uma migração SQL nova, atualize `schema.sql` e o dicionário de dados e rode `pnpm db:migrar` e `pnpm db:introspectar`. `pnpm db:parar` para o contêiner; `docker compose down -v` apaga os dados locais (destrutivo).

## Contas e acesso

Todos entram em `/entrar` somente com **e-mail e senha** (o cadastro fica em `/cadastro`, em tela própria); o perfil vem da conta e leva ao painel certo (`/cliente`, `/operador` ou `/admin`). A senha é conferida no servidor (scrypt). A sessão é **opaca e guardada no banco** (ADR-001): o navegador recebe só um token aleatório em cookie `httpOnly` e o banco guarda o seu SHA-256; cliente: 30 dias, renovados a cada uso; batedeira e administrador: 12 horas. Cada layout de área (`app/admin`, `app/operador`, `app/cliente`) e cada rota de API validam a sessão e o papel **no servidor**; `proxy.ts` só faz uma checagem otimista do cookie. Conta bloqueada não autentica e a troca de senha encerra todas as sessões.

**Limitação de tentativas** (no banco, ADR-001): por e-mail, espera crescente a partir de 10 falhas em 15 minutos (1, 5 e 15 minutos); por origem, 50 falhas em 15 minutos. A origem é guardada só como HMAC do IP com `SESSION_SECRET`; a resposta é igual para e-mail inexistente, senha errada e conta bloqueada. Cadastro, "esqueci a senha" e redefinição usam uma limitação simples em memória.

**Cadastro pelo site** (`/cadastro`), com campos obrigatórios por tipo:

- **Cliente:** nome, telefone com DDD, endereço de entrega (rua, número e bairro da lista oficial de 13 bairros urbanos; complemento e referência opcionais), e-mail e senha (mínimo de 8 caracteres). O endereço vira o endereço principal salvo.
- **Batedeira:** CPF ou CNPJ válido, nome da batedeira, endereço (rua, número e bairro da lista oficial), nome do responsável, telefone, e-mail e senha. A batedeira nasce **Em análise** (fechada e sem entrega), com faixa estimada provisória de 30 a 45 minutos, e só recebe pedidos depois que o administrador a ativar.

O CPF/CNPJ fica só no banco: o administrador o vê mascarado e o usuário não o recebe de volta.

**Esqueceu a senha:** `/esqueci-senha` gera um link de uso único, válido por 30 minutos (só o hash fica no banco), para `/redefinir-senha`. Ainda **não há provedor de e-mail**: em desenvolvimento o link aparece no log do servidor; em produção nada é enviado (`lib/email.ts`) e, como o e-mail transacional está fora do MVP (DEC-035), a recuperação de acesso é assistida pelo administrador (DEC-061).

**Administrador:** nunca se cadastra pelo site. Crie-o no servidor, com senha aleatória exibida uma única vez:

```sh
pnpm acesso:criar admin@exemplo.com "Nome do Administrador"
```

Não existe mais conta de operador criada por script: batedeiras se cadastram pelo site e o administrador as ativa. As variáveis `STAFF_ACCOUNTS` e `ACCOUNTS_FILE` e o arquivo `.data/accounts.json` deixaram de existir.

## Estado atual e limitações

- **Dados ainda no navegador:** sacola, endereços salvos do cliente, contato de suporte, solicitações de recuperação de acesso e o bloqueio de cliente ficam no `sessionStorage`. Os pedidos **não**: cliente, batedeira e administrador enxergam os mesmos pedidos em qualquer aparelho.
- **Pedidos no servidor:** preço, taxa e total são recalculados no servidor com os dados do banco (o navegador só confirma o que viu; se mudou, o pedido é recusado para revisão). O mesmo `requestId` do mesmo cliente nunca duplica o pedido. Cada mudança de estado é uma transação com o pedido bloqueado, então o aceite da batedeira e a expiração automática não se atropelam. A expiração roda a cada 10 s em `instrumentation.ts` (exige processo persistente) e também ao listar pedidos.
- **Catálogo no banco:** batedeiras, produtos, cobertura e horários valem para todos os aparelhos; o cliente só vê batedeiras **ativas**. A batedeira se prepara (produtos, bairros, horários) enquanto está em análise e o administrador a ativa em `/admin` (exige ao menos um bairro e a confirmação de elegibilidade, com motivo e auditoria no banco). O bloqueio de conta funciona no servidor, mas ainda não há tela para bloqueá-la.
- **Fotos:** o envio de fotos de batedeira e de produto está desligado até haver armazenamento de objetos (ADR-003, backlog 2.5); a imagem ilustrativa padrão é usada. Os produtos agrupam os tamanhos pelo nome (ex.: "Açaí de 15" em 500 ml e 1 L).
- **Pagamento (PRD 2.7):** o pedido nasce sem forma de pagamento; depois do aceite o cliente tem 10 minutos para escolher dinheiro na entrega (o preparo começa) ou Pix on-line (até 10 minutos para pagar; só para batedeira com conta de pagamento `VERIFICADA`). Sem escolha ou com Pix expirado, o pedido é encerrado sem custo. **Ainda não há provedor de pagamento (hoje só dinheiro na entrega; o servidor recusa Pix):** não existe cobrança Pix, webhook real, estorno nem contestação (dependem da ADR do provedor, Épico 9); em desenvolvimento, um botão simula a confirmação do provedor. O faturamento do dia conta o dinheiro na entrega e o Pix na confirmação (DEC-058); estornos ainda não são descontados.
- **Bairros (DEC-057):** a lista oficial está em `lib/neighborhoods.ts`; cada batedeira escolhe os bairros que atende, com taxa e estimativa por bairro, e só pode ser ativada com pelo menos um.
- **Documentos legais:** política de privacidade e termos de uso ainda não existem e são obrigatórios antes do piloto.
- **Hospedagem:** o login lê o IP de `x-forwarded-for`, o que exige proxy confiável; a limitação de cadastro e redefinição é em memória (uma instância); a escolha do provedor segue pendente na ADR-003.

As regras de negócio vigentes estão em [`docs/product/PRD.md`](../docs/product/PRD.md) e [`docs/product/decisions.md`](../docs/product/decisions.md); o modelo de dados oficial é [`database/schema.sql`](../database/schema.sql).
