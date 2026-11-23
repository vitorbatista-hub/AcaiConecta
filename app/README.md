# AçaíConecta — aplicação (MVP)

Código do MVP, escrito do zero a partir do PRD vigente, de `docs/product/decisions.md`, de `database/schema.sql` e das ADRs. **Não reaproveita nada de `prototypes/web/`.** Roda somente em ambiente local (DEC-051); o deploy depende da ADR-003, ainda proposta.

## Requisitos

Node.js 24, pnpm e Docker.

## Primeiros passos

```sh
cd app
pnpm install
cp .env.example .env     # valores só para o banco local
pnpm db:up               # MySQL 8 em Docker (porta 3307)
pnpm db:migrate          # aplica a migração 0001 (= database/schema.sql)
pnpm db:generate
pnpm db:seed             # dados fictícios de desenvolvimento
pnpm dev
```

Verificações:

```sh
pnpm typecheck
pnpm test        # testes de domínio, sem banco
pnpm test:db     # testes de integração contra o MySQL local
pnpm build
```

## Estrutura

- `src/domain/`: regras de negócio em TypeScript puro, sem I/O (dinheiro em centavos, cálculo e validação do pedido, máquina de estados, disponibilidade por horário, catálogo, senha, limitação de login, sessão).
- `src/server/`: casos de uso com Prisma (criar pedido idempotente, transição atômica, expiração, mensagens operacionais, cadastro, login, sessão, bloqueio de conta, expurgo).
- `src/db/`: cliente Prisma e testes de restrições do banco.
- `prisma/`: mapeamento do schema e migrações.

## Banco de dados

`database/schema.sql` é a fonte oficial. A migração `0001` é esse arquivo sem a criação do banco, para preservar `CHECK`, índices e restrições que o Prisma não representa; o teste `schema-sincronizado` falha se os dois divergirem. Para mudar a estrutura, altere o `schema.sql`, crie uma migração nova em `prisma/migrations/`, atualize `prisma/schema.prisma` e a documentação.

Usuários do seed (senha única de desenvolvimento, impressa pelo comando): `admin@`, `cliente@`, `joao@` e `maria@acaiconecta.local`.

## O que está pronto

- Pedido: criação com totais em centavos, volume mínimo de 1 litro, taxa por bairro, troco, snapshots, prazo de 5 minutos e idempotência garantida por restrição única do banco, inclusive com requisições simultâneas.
- Estados: matriz de transições do PRD §12.3, permissões por papel, motivos obrigatórios, expiração e transições atômicas com bloqueio de linha.
- Autenticação (ADR-001): sessões opacas com hash no banco, 30 dias renováveis para cliente e 12 horas para equipe, argon2id, limitação por e-mail e por origem (HMAC), resposta uniforme, bloqueio que encerra sessões e expurgo.

## Próximos passos (combinados em 23/11/2026)

Próxima sessão: cookie de sessão e proteção de rotas; depois telas do cliente, do operador e do administrador, nessa ordem. Antes, confirmar as premissas listadas abaixo.

## O que falta

Telas e rotas (cliente, operador, administrador), cookie de sessão e proteção das rotas, SSE (ADR-002), agendamento do expurgo e da expiração, catálogo e configurações do operador, administração de batedeiras e bairros, métricas do piloto, upload de fotos, PWA, observabilidade e deploy.

## Premissas adotadas e a confirmar

- O administrador só cancela pedidos após o aceite; não responde nem avança pedidos (matriz de `docs/product/flows.md`).
- As listas de motivos de recusa e de cancelamento operacional não estão no PRD; as do código são provisórias (`src/domain/pedido/estados.ts`). Os motivos de falha de entrega seguem o PRD §13.2.
- Batedeira só está "aberta" com a chave manual ligada e dentro de um horário regular ativo; sem horário cadastrado, fica fechada.
- A lista de senhas comuns é uma amostra; ampliar antes do piloto.
