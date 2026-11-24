# AçaíConecta — aplicação web

Aplicação web (Next.js, React, TypeScript e Tailwind CSS) para conectar consumidores às batedeiras de açaí tradicional de Cametá/PA. Cobre as áreas do cliente, da batedeira (operador) e da administração.

## Requisitos

Node.js 24 e pnpm compatível com o lockfile.

## Execução local

```sh
cd app
pnpm install --frozen-lockfile
cp .env.example .env.local   # preencha SESSION_SECRET e STAFF_ACCOUNTS (veja abaixo)
pnpm dev                     # http://localhost:3000
```

Verificações: `pnpm typecheck`, `pnpm test` e `pnpm build`. Não há script de lint.

## Contas e acesso

Todos entram em `/entrar` somente com **e-mail e senha** (o cadastro fica em `/cadastro`, em tela própria); o perfil vem da conta e leva ao painel certo (`/cliente`, `/operador` ou `/admin`). A senha é conferida no servidor (scrypt) e a sessão é um cookie `httpOnly` assinado com `SESSION_SECRET`; `proxy.ts` protege as três áreas, as tentativas de login e de cadastro são limitadas e nenhuma credencial vai ao navegador ou ao Git.

**Cadastro pelo site** (`/cadastro`), com campos obrigatórios por tipo:

- **Cliente:** nome, telefone com DDD, endereço de entrega (rua e número; complemento e referência opcionais; Centro), e-mail e senha (mínimo de 8 caracteres). O endereço vira o endereço principal salvo.
- **Batedeira:** CPF ou CNPJ válido, nome da batedeira, endereço (rua e número; piloto só no Centro), nome do responsável, telefone, e-mail e senha. A batedeira nasce **Em análise**: acessa o painel, mas só recebe pedidos depois que o administrador a ativar.

O CPF/CNPJ fica só no servidor: o administrador o vê mascarado e o usuário não o recebe de volta. As contas cadastradas ficam em `.data/accounts.json` (ou em `ACCOUNTS_FILE`), fora do Git, com hash da senha. É um armazenamento simples, de uma instância, e **não é durável em contêiner**; deve ser trocado por banco de dados.

**Esqueceu a senha:** `/esqueci-senha` gera um link de uso único, válido por 30 minutos, para `/redefinir-senha`. Ainda **não há provedor de e-mail**: em desenvolvimento o link aparece no log do servidor; em produção nada é enviado até configurar um provedor (`lib/email.ts`). Contas fixas de `STAFF_ACCOUNTS` não usam esse fluxo (a senha delas é trocada gerando nova entrada), e a sessão aberta antes da troca continua válida até expirar (12 h).

**Contas fixas** (administrador e operadores iniciais) ficam na variável `STAFF_ACCOUNTS` (JSON com hash). Para criar uma, com senha aleatória exibida uma única vez:

```sh
pnpm acesso:gerar admin@exemplo.com admin
pnpm acesso:gerar operador@exemplo.com operador store-001 "Nome do Operador"
```

Copie o trecho JSON para `STAFF_ACCOUNTS` (`.env.local` ou variáveis da hospedagem). Em produção defina `SESSION_SECRET` e `STAFF_ACCOUNTS` no provedor.

## Estado atual e limitações

- **Dados no navegador:** catálogo, pedidos, endereços e auditoria ficam no `sessionStorage` do navegador. Não há banco de dados nem sincronização entre dispositivos: o cliente, a batedeira e o administrador **não enxergam os mesmos pedidos** quando estão em aparelhos diferentes. Isso impede o uso real com vários usuários e é a principal pendência.
- **Conta × dados:** as contas são do servidor, mas catálogo, pedidos, endereços e auditoria seguem no navegador. O administrador só vê no navegador dele as batedeiras cadastradas (via `/api/admin/batedeiras`), não os pedidos delas. Bloqueio efetivo de cliente e recuperação de acesso ainda não existem de ponta a ponta.
- **Pix:** o QR Code só aparece quando a batedeira informa a chave Pix nas configurações; a plataforma não processa nem confirma pagamentos (DEC-030).
- **Documentos legais:** política de privacidade e termos de uso ainda não existem e são obrigatórios antes do piloto.
- **Hospedagem:** o login limita tentativas em memória (uma instância) e lê o IP de `x-forwarded-for`, o que exige proxy confiável; a escolha do provedor segue pendente na ADR-003.

As regras de negócio vigentes estão em [`docs/product/PRD.md`](../docs/product/PRD.md) e [`docs/product/decisions.md`](../docs/product/decisions.md); o modelo de dados oficial é [`database/schema.sql`](../database/schema.sql).
