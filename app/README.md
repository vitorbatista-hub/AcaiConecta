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

- Sessão HTTP: cookie httpOnly, `SameSite=Lax` (e `__Host-` com `Secure` em produção); `proxy.ts` faz só a checagem otimista de cookie; a autorização real é no servidor (`exigirPapelNaPagina` nas páginas e `exigirPapel` em toda mutação). Telas `/entrar`, `/cadastro` e páginas-esqueleto `/conta`, `/operador` e `/admin`. Destino pós-login restrito a caminhos internos do papel.
- Página inicial (`/`): apresentação, vitrine de batedeiras e produtos, como funciona e chamadas para a listagem. Telas do cliente: listagem com busca por nome e filtro por bairro (`/batedeiras`), perfil com cardápio e sacola, endereço, pagamento e envio idempotente (`/batedeiras/[id]`), acompanhamento com linha do tempo e cancelamento enquanto aguarda resposta (`/pedidos/[codigo]`), histórico (`/pedidos`) e conta com endereços salvos (`/conta`). A atualização do acompanhamento é uma reconsulta a cada 10 s, contingência até o SSE.
- Telas do operador: painel `/operador` com chaves de aberta/entrega (com confirmação), resumo do dia (DEC-043), fila por ordem de criação com contagem do prazo de 5 minutos, aceitar, recusar com motivo, avançar estados, cancelar e registrar falha com motivo, mensagens operacionais e encerrados do dia; `/operador/catalogo` (produtos de 500 ml ou 1 L, disponibilidade, exibição quando indisponível, arquivar) e `/operador/configuracoes` (descrição, telefone, estimativa, bairros e taxas entre os habilitados, um horário por dia). O `batedeiraId` vem sempre da sessão. Alerta de novo pedido e reconsulta a cada 10 s são a contingência até o SSE; enquanto não há agendador, os pedidos vencidos são expirados ao carregar o painel e o acompanhamento do cliente.
- Telas do administrador: `/admin` com métricas do piloto dos últimos 30 dias (respostas em 5 min, aceite, conclusão, cancelamento após aceite, expirados, recompra, motivos); `/admin/batedeiras` com cadastro assistido (operador e batedeira em análise), requisitos de ativação e ativar, suspender, reativar e desativar com motivo; `/admin/bairros` (novos nascem desabilitados); `/admin/pedidos` com filtros, histórico de estados, mensagem predefinida do suporte e cancelamento administrativo; `/admin/usuarios` com bloqueio, reativação e redefinição de senha; `/admin/auditoria`. Toda ação administrativa revalida o papel no banco e grava em `eventos_auditoria` na mesma transação.

## Próximos passos (combinados em 23/11/2026)

Próximo: SSE (ADR-002) e agendamento da expiração dos pedidos e do expurgo de autenticação; depois, edição de endereços do cliente, fotos e observabilidade. Premissas abaixo confirmadas pelo responsável em 23/11/2026.

## O que falta

Edição e remoção de endereços salvos na conta do cliente, SSE (ADR-002), agendamento do expurgo e da expiração, catálogo e configurações do operador, administração de batedeiras e bairros, métricas do piloto, upload de fotos, PWA, observabilidade e deploy.

## Premissas adotadas (confirmadas em 23/11/2026)

- O administrador só cancela pedidos após o aceite; não responde nem avança pedidos (matriz de `docs/product/flows.md`).
- As listas de motivos de recusa e de cancelamento operacional não estão no PRD; as do código são provisórias (`src/domain/pedido/estados.ts`). Os motivos de falha de entrega seguem o PRD §13.2.
- Batedeira só está "aberta" com a chave manual ligada e dentro de um horário regular ativo; sem horário cadastrado, fica fechada.
- A lista de senhas comuns é uma amostra; ampliar antes do piloto.

## Imagens

Não há envio de fotos ainda (backlog 2.5, depende do armazenamento da ADR-003). `FotoOuArte` mostra `imagemUrl` quando existir (só `https://` ou caminho local) e, senão, uma arte original da marca. Não usar fotos de terceiros nem as imagens do protótipo (DEC-038).
