# Verificação do protótipo — 16/09/2026

## Escopo e resultado

Correções do fluxo principal da demonstração concluídas: cliente cria um pedido, a batedeira recebe e atualiza a operação, e o administrador consulta e registra intervenções. Os três perfis compartilham dados fictícios na mesma aba. Não há API ou banco nesta cadeia; as fronteiras verificadas são interface → regras em memória → armazenamento da sessão → interface de outro perfil.

Esta verificação técnica não representa validação com usuários, cobertura integral do PRD, implementação do MVP ou conclusão da Fase 2. Limitações funcionais restantes estão no [README](README.md).

## Verificações automatizadas

Ambiente: Node.js 24.15.0, dependências já instaladas no repositório.

| Verificação | Resultado |
|---|---|
| `pnpm typecheck` | Aprovada, TypeScript estrito. |
| `pnpm test` | 15 testes aprovados. |
| `pnpm build` | Aprovado com Turbopack, rotas `/`, `/cliente`, `/operador` e `/admin`. |
| `pnpm build -- --webpack` | Aprovado durante diagnóstico; configuração padrão preservada. |
| `git diff --check` | Aprovado. |
| Lint | Não há comando configurado. |

O primeiro build encontrou um link `.next` apontando para diretório temporário ausente. Após recriação, o cache antigo ainda produziu erro de Turbopack; uma pasta `.next` local limpa resolveu a falha. O conteúdo temporário anterior foi preservado. O build final usou o comando padrão, sem ignorar erros de tipos.

## Matriz de cenários

| Requisito / fluxo | Local | Evidência |
|---|---|---|
| Descoberta e catálogo | `/cliente` | Navegador: batedeiras visíveis, catálogo fechado bloqueia adição. |
| Volume mínimo | Sacola; `tests/orders.test.mjs` | Navegador: 500 ml bloqueados, 2 × 500 ml liberados; testes de volume aprovados. |
| Total e taxa | Checkout | Navegador: 2 × R$ 18,00 + R$ 2,50 = R$ 38,50, preservados no histórico. |
| Pix, dinheiro e troco | Checkout; testes | Pix enviado no navegador; testes aprovados para exclusão do troco no Pix e valor suficiente/integral em dinheiro. |
| Disponibilidade, bairro, catálogo e quantidade | Testes | Bloqueios por estado da batedeira, entrega, bairro, mistura de lojas, produto e quantidade inválida. |
| Recebimento e acompanhamento | Cliente → operador → cliente | Navegador: pedido criado pela interface e recebido no painel; aceite, preparo, pronto, saída e entrega registrados e vistos pelo cliente. |
| Matriz e perfis | Testes | Saltos, vínculos incorretos, reabertura de estados terminais e ações de perfil indevido rejeitados. Simulação não garante autorização real. |
| Recusa e falha | Testes | Motivo obrigatório e estados terminais verificados; não exercitados nesta revisão pela interface. |
| Expiração | Testes | Aceite imediatamente antes do limite permitido, no limite bloqueado; expiração sem duplicação de eventos. Não houve espera real de cinco minutos no navegador. |
| Idempotência | Testes | Mesma chave não duplica pedido. Não equivale a transação concorrente de backend. |
| Cancelamento | Administrador; testes | Navegador: pedido em preparo cancelado por impossibilidade operacional com motivo e auditoria. Testes cobrem limites dos perfis e saída para entrega. |
| Intervenção administrativa | `/admin?view=pedidos` | Navegador: mensagem registrada na linha do tempo e na auditoria; dois registros após intervenção e cancelamento. |
| Persistência de demonstração | Troca de rotas / recarga | Pedido e auditoria preservados no `sessionStorage` durante navegação na mesma aba, inclusive após reinício do servidor. |
| Horários | Testes | Fuso de Cametá, domingo zero, fechamento manual, próxima semana e intervalos ordenados. |
| Modais e teclado | Catálogo | Navegador: Escape fecha e devolve foco ao botão “Ver catálogo”. |
| Responsividade e menu | Cliente e administrador | Navegador em 390 × 844: sem rolagem horizontal nas telas verificadas; menu do cliente permite acessar histórico. |
| Erros de execução | Rotas percorridas | Nenhum erro de página ou console observado na sessão automatizada. |

O navegador usado foi o Chrome local via agent-browser, executando `next start` na porta 3100. Os horários da primeira batedeira foram ampliados somente nos dados fictícios da sessão para permitir o cenário fora do horário comercial. A taxa de R$ 2,50 foi configurada pela interface. Isso não modifica dados iniciais, requisitos ou decisões de produto.

A captura de imagem final do histórico móvel excedeu o prazo do CDP. A URL, presença dos estados Entregue/Cancelado, ausência de rolagem horizontal e erros de página foram conferidas em seguida por consulta ao navegador. As capturas da página inicial e do administrador móvel foram inspecionadas visualmente.

## Ajustes finais desta revisão

- Adicionar ao catálogo só apresenta confirmação quando a adição é efetivada; desistir da troca de sacola não produz sucesso falso.
- Próxima abertura considera o mesmo dia na semana seguinte e ordena intervalos por horário.
- Menu móvel informa estado expandido e alterna o nome acessível entre abrir e fechar.
- Documentação anterior de falhas substituída pelo estado verificado e pelas limitações atuais.

## Validação com participantes

Ainda pendente. Usar os cenários acima para observar compreensão de abertura versus entrega, mínimo de um litro, taxa, Pix na entrega, prazo de aceite, cancelamento e suporte. Registrar dificuldades e resultados antes de decidir sobre a conclusão da prototipação. Arquitetura, revisão do modelo de dados e backlog também continuam necessários para encerrar a Fase 2.


## Revalidação local em 16/09/2026 (tarde)

Entre 14h11 e 14h32, após a verificação acima, o código recebeu login/cadastro simulados do cliente, bloqueio/reativação de conta auditados, endereços salvos com endereço principal, foto ilustrativa de produto/batedeira e um painel de ajuda (detalhes no [README](README.md#adições-posteriores-à-verificação-de-1609-pendentes-de-verificação-em-navegador-e-no-v0)). Estas adições não foram exercitadas pelo navegador automatizado nem reenviadas ao v0 — apenas as verificações automatizadas abaixo foram repetidas.

| Verificação | Resultado |
|---|---|
| `pnpm typecheck` | Aprovada, sem erros. |
| `pnpm test` | 20 testes aprovados (5 novos em `tests/customer-session.test.mjs`, inexistente na verificação anterior). |
| `pnpm build` | Aprovado com Turbopack, mesmas quatro rotas (`/`, `/cliente`, `/operador`, `/admin`). |

A tabela de hashes da sincronização com o v0, abaixo, deixou de corresponder ao conteúdo atual de `next.config.mjs`, `app/globals.css`, `app/cliente/page.tsx`, `app/operador/page.tsx`, `app/admin/page.tsx`, `components/app-shell.tsx`, `components/modal.tsx`, `components/order-panel.tsx`, `components/prototype-provider.tsx` e `lib/mock-data.ts` — todos editados depois daquele envio. Os arquivos novos desta revalidação (`components/customer-account.tsx`, `components/customer-order.tsx`, `components/support-panel.tsx`, `components/photo-field.tsx`, `lib/customer-session.ts`, `lib/order-presentation.ts`, `tests/customer-session.test.mjs`) nunca foram enviados ao v0.

## Correção de alinhamento com a documentação e nova sincronização (16/09/2026, noite)

Uma revisão de coerência entre a documentação vigente (PRD 2.5, `decisions.md`, README) e o protótipo identificou três divergências, sem regra de negócio envolvida: título e rodapé descreviam o produto como "marketplace" (termo do PRD v1, arquivado); `next.config.mjs` mantinha um `remotePatterns` para o host de imagem da versão anterior, sem uso ativo; e este arquivo (`VERIFICATION.md`) registrava os comandos de verificação com `npm` em vez de `pnpm`. `app/layout.tsx`, `app/page.tsx` e `next.config.mjs` foram corrigidos; tipos, os 20 testes e o build (Turbopack, mesmas quatro rotas) foram revalidados localmente com sucesso.

Os três arquivos corrigidos foram enviados ao [chat existente do v0](https://v0.app/vitors-projects-edcbface/chat/acaiconecta-jAWnqGHlb8w) via `sendChatMessage` do MCP v0. O v0 aplicou os anexos nos mesmos caminhos, rodou `pnpm typecheck` com sucesso e retornou os hashes SHA-256 abaixo, idênticos aos calculados localmente:

| Arquivo relativo a `prototypes/web/` | SHA-256 confirmado |
|---|---|
| `next.config.mjs` | `0d4bb261950b321a1489cc8f38d5c5e49f7f6f3fdcc1302827279e3e3fefa2a7` |
| `app/layout.tsx` | `e6afd75540165ddd277bea6bd19d63256890f7896acd806115cce085d9c1ce14` |
| `app/page.tsx` | `90e615f2bca023d6f889bb378f7a8e14e5b73b02d3bb03bfae8f91048574217b` |

Esta sincronização cobre somente os três arquivos corrigidos, não o conjunto completo listado na sincronização de 16/09/2026 (tarde) abaixo — os demais arquivos alterados desde então (login/cadastro, endereços salvos, foto ilustrativa, painel de ajuda) continuam pendentes de reenvio ao v0. Não foi solicitada nova publicação em produção; a Fase 2 e suas pendências de validação com usuários permanecem inalteradas.

## Substituição da foto ilustrativa, feita diretamente no v0 (17/09/2026)

Diferentemente das sincronizações anteriores (sempre local → v0), desta vez o responsável pelo projeto interagiu diretamente com o chat do v0, sem passar por esta sessão, pedindo a substituição da foto ilustrativa única do protótipo (`acai-tradicional.webp`) e o envio de outras quatro fotos (`acai1.webp`, `acai2.jpeg`, `acai3.jpeg`, `acai4.jpeg`) para "espalhar pelos 3 acessos" (cliente, operador, admin).

Ao investigar o pedido de sincronização de volta para este repositório, foi constatado que:

- `lib/mock-data.ts`, `components/prototype-provider.tsx`, `components/photo-field.tsx`, `app/cliente/page.tsx`, `app/operador/page.tsx` e `app/admin/page.tsx` permaneceram com os mesmos hashes SHA-256 da sincronização anterior — nenhum código foi alterado para referenciar as quatro fotos novas em nenhum dos três acessos, apesar do pedido.
- Somente `public/images/acai-tradicional.webp` foi de fato substituído (hash mudou) e continua em uso, pois todo o mapeamento `traditionalAcaiImages` do `mock-data.ts` aponta para esse único arquivo, como antes.
- As quatro fotos novas (mais três outras — `acai-bowl.png`, `acai-cup.png`, `acai-family.png` — encontradas no mesmo lote) não são referenciadas por nenhum arquivo de código: ficaram órfãs no projeto do v0.
- Pelo menos três das fotos enviadas pelo responsável do projeto ao v0 (usadas para gerar `acai4.jpeg` e duas das fotos órfãs) trazem marca d'água visível de um negócio de terceiro ("Açaí no Ponto") e indícios de terem sido capturadas de um carrossel do Instagram — não são fotos originais nem das batedeiras parceiras da Fase 1. A foto que efetivamente ficou em uso (`acai-tradicional.webp`, uma tigela com a marca genérica "AÇAÍ") também aparenta ser de origem semelhante (mesmos indícios de carrossel), embora sem a marca do terceiro identificado.

Como o v0 atingiu o limite diário de mensagens da conta antes de fornecer uma forma de baixar os bytes exatos dos arquivos alterados, o responsável pelo projeto baixou o projeto completo pela própria interface do v0 e adicionou a pasta `prototypes/acai-conecta/` (fora do controle de versão) para viabilizar a sincronização. O arquivo `public/images/acai-tradicional.webp` foi conferido por hash SHA-256 contra o valor informado pelo v0 (`811dfdc51a1acc4bb25af4d7b62db9437e889d70c4bf6a1abccc7003f16708e3`) e aplicado em `prototypes/web/public/images/acai-tradicional.webp`. Tipos, 22 testes e build foram revalidados com sucesso após a troca.

As demais seis fotos (as quatro pedidas mais as três órfãs) não foram trazidas para este repositório: além de não estarem em uso em nenhum código, ao menos parte delas carrega marca d'água de terceiro, o que pediu decisão do responsável pelo projeto antes de qualquer uso.

**Decisão (DEC-038, 17/09/2026):** manter no código apenas fotos sem marca d'água ou identificação visual de negócio terceiro. A foto em uso (`acai-tradicional.webp`) não apresenta essa marca e permanece. As demais fotos do lote (`acai1.webp`, `acai2.jpeg`, `acai3.jpeg`, `acai4.jpeg` e as três órfãs `acai-bowl.png`, `acai-cup.png`, `acai-family.png`) continuam fora do repositório e fora de controle de versão (pasta `prototypes/acai-conecta/`, não presente neste checkout). Delas, três têm marca d'água confirmada de "Açaí no Ponto" (`acai4.jpeg` e duas das órfãs, sem identificação individual de quais); as quatro restantes (`acai1.webp`, `acai2.jpeg`, `acai3.jpeg` e a órfã restante) nunca tiveram a ausência de marca confirmada individualmente. Nenhuma delas será referenciada no código sem essa confirmação individual, foto a foto. Ver [decisions.md](../../docs/product/decisions.md#DEC-038).

## Sincronização com o v0

**Nota:** 10 dos 15 arquivos abaixo foram alterados após este envio; ver [Revalidação local](#revalidação-local-em-16092026-tarde) para o que deixou de corresponder.

Em 16/09/2026, envio autorizado de 15 arquivos ao [chat existente](https://v0.app/vitors-projects-edcbface/chat/acaiconecta-jAWnqGHlb8w), usando `sendChatMessage` do MCP v0. Identificador da resposta concluída: `rTb5nlRCge1daEHSV16XzCXajth88JJY`.

O v0 registrou a aplicação dos anexos nos caminhos correspondentes e retornou os hashes abaixo, conferidos contra o manifesto local de envio. Os demais arquivos não foram incluídos nesta comparação. Documentação local e arquivos binários não foram enviados.

No ambiente remoto, `pnpm typecheck`, `pnpm test` (15 aprovados) e `pnpm build` concluíram com sucesso. O registro remoto também mostrou navegação na página inicial com agent-browser. Não foi repetido o ciclo completo de pedidos no preview remoto nesta sincronização.

Preview retornado pelo MCP: https://acaiconecta.v0.build. Não foi solicitada publicação em produção. A Fase 2 e suas pendências de validação permanecem inalteradas.

| Arquivo relativo a `prototypes/web/` | SHA-256 confirmado |
|---|---|
| `.gitignore` | `953e5932e8b81c37c0a19a80713b65b1edcc33a981fecc690fb6a9feb01fd941` |
| `package.json` | `f978b67ba768fb171003c3c0a9053260fe175d465967decced3027df039047a3` |
| `next.config.mjs` | `fd7f5a9f7adad015f0a6e10004e070c83365b6d3d0798bdc86769754b312a661` |
| `app/layout.tsx` | `2a6015dfebda24700b7a26fb511a519035c0a137ed0eaf980a0433a5e444da12` |
| `app/globals.css` | `0e99a5c2e7ea99c5635bd45a5b9507bbdde553f3865b4d0065c1f37d29b58c8b` |
| `app/cliente/page.tsx` | `175b8fba63f6515561e41f2ad8f37488af4fd02e6476db43be8696a2d34fde7b` |
| `app/operador/page.tsx` | `0b0b2c2b04c862977d5cccc76967c2044c7b6871e12dbc2a7773e82022795582` |
| `app/admin/page.tsx` | `244f6ea4ec1ca3c5d38c7ee4fe4df46c8318d3d21a631063817cee452bb14c17` |
| `components/app-shell.tsx` | `a8a76c312c6debd820a7068d881704f53932c754679e2188342db4748cd7ca31` |
| `components/modal.tsx` | `1287f62c32da440bb7b569468b6c9441ad2f30e1a7674092c9b3fd5ae3c5271b` |
| `components/order-panel.tsx` | `03e55bd0334ee73b8618cf9eec646999f49e27d8f35247bcfff8dc4c6ea149c5` |
| `components/prototype-provider.tsx` | `f8c5abd6fcde07a63358328776babe95f8e1b1f13be284e4fd732784b03df392` |
| `lib/mock-data.ts` | `2266ce480816de681fe0503bcb91a97038a31190b5dcc8c5d76cbf1a40572fcb` |
| `lib/use-view.ts` | `71696e10c5c6e092bb8762da24a882516b88f05541f1dede1ab87869dbcd8fe2` |
| `tests/orders.test.mjs` | `7e4c31d7cacec14eda50941c1a0b193350b5e4d07bdef22f886d6e0f506c1774` |

## Tentativa de verificação em navegador em 16/09/2026

Tentativa de verificar em navegador real login/cadastro simulado, bloqueio/reativação de conta, endereços salvos, foto ilustrativa e painel de ajuda. O servidor (`pnpm start`, porta 3100) subiu e respondeu HTTP 200 em `/`, mas a extensão Claude in Chrome não está configurada nesta sessão, então nenhuma navegação ou interação real foi possível. Nenhum dos cinco itens foi exercitado; permanecem pendentes de verificação em navegador, como já registrado nas seções anteriores.

## Revalidação local em 17/09/2026

Levantamento de cobertura do PRD 2.5 no protótipo identificou duas divergências, sem regra de negócio envolvida: o texto alternativo das fotos de batedeira na listagem do cliente era idêntico para todas ("Açaí tradicional; imagem ilustrativa"), sem nomear o estabelecimento; e o README descrevia as métricas de apoio do piloto (seção 5.4 do PRD) como não representadas, quando já estão implementadas em `lib/order-presentation.ts` (`pilotMetrics`) e exibidas em `/admin` desde a sincronização anterior.

`app/cliente/page.tsx` foi ajustado para que o texto alternativo nomeie cada batedeira (`Foto ilustrativa de açaí tradicional da {batedeira}`); o README foi corrigido quanto às métricas.

| Verificação | Resultado |
|---|---|
| `pnpm typecheck` | Aprovada, sem erros. |
| `pnpm test` | 22 testes aprovados (mesma suíte da sincronização anterior; a contagem de 20 registrada nas seções acima já estava desatualizada antes desta revisão). |
| `pnpm build` | Aprovado com Turbopack, mesmas quatro rotas. |

Verificação em navegador não foi possível nesta sessão (extensão Claude in Chrome não conectada). O reenvio de `app/cliente/page.tsx` ao v0 está registrado abaixo, junto com o login simulado de operador e administrador. A Fase 2 e suas pendências de validação com participantes permanecem inalteradas.

## Login simulado de operador e administrador em 17/09/2026

A pedido do responsável pelo projeto, `/operador` e `/admin` passaram a exigir um login simulado antes de exibir o painel, seguindo o mesmo padrão já usado no login do cliente (qualquer senha não vazia simula o acesso; nenhuma senha é persistida). Novo componente `components/role-login.tsx` (`useRoleSignIn`, `RoleLogin`, `RoleSignedInBar`), reaproveitado pelos dois perfis. No login do operador, a lista de batedeiras vem do estado compartilhado da demonstração, incluindo cadastros administrativos adicionados durante a sessão. `app/operador/page.tsx` e `app/admin/page.tsx` foram alterados; o fluxo do cliente não foi tocado.

| Verificação | Resultado |
|---|---|
| `pnpm typecheck` | Aprovada, sem erros. |
| `pnpm test` | 22 testes aprovados (suíte inalterada; login simulado não tem cobertura de teste de domínio própria, por não introduzir regra de negócio nova). |
| `pnpm build` | Aprovado com Turbopack, mesmas quatro rotas. |

Verificação em navegador não realizada nesta sessão (extensão Claude in Chrome não conectada) — o fluxo de login/logout de operador e administrador ainda não foi exercitado num navegador real.

`app/operador/page.tsx`, `app/admin/page.tsx`, `components/role-login.tsx` e `app/cliente/page.tsx` (pendente desde a [revalidação acima](#revalidação-local-em-17092026)) foram enviados em uma única mensagem ao [chat existente do v0](https://v0.app/vitors-projects-edcbface/chat/acaiconecta-jAWnqGHlb8w) via `sendChatMessage` do MCP, com autorização explícita do responsável pelo projeto. O v0 aplicou os quatro arquivos nos caminhos correspondentes, rodou `pnpm typecheck` (aprovado, sem erros) e retornou o SHA-256 de cada arquivo aplicado:

| Arquivo relativo a `prototypes/web/` | SHA-256 confirmado |
|---|---|
| `app/operador/page.tsx` | `af84eb29722ee7c5d06ace825a2342d92731abc7a41568ccfe36adf215214198` |
| `app/admin/page.tsx` | `848cc0af308473cb3f12b8425050d1aa3df83b0fa371cff1b7d84bb9bcca49ea` |
| `components/role-login.tsx` | `8843c8414b5245ae1c762db66513190ac0b1d33713e3523b91035b6e2f085584` |
| `app/cliente/page.tsx` | `ee9320598899f6ee4af3857820585fa94c0e24bbcf4e0cf2a0a9dd7047d64bd9` |

Os quatro hashes coincidem exatamente com os calculados localmente antes do envio — nenhuma divergência. Não foi solicitada nova publicação em produção. A verificação em navegador destas telas continua pendente.

## Correção do login de operador em 17/09/2026

O responsável pelo projeto apontou que o login de operador acima (seleção da batedeira em uma lista suspensa) não seguia boas práticas de login, mesmo sendo simulação. Corrigido para pedir e-mail e senha fictícios, como os logins de cliente e administrador; a batedeira é identificada pelo e-mail cadastrado (`store.operatorEmail`, novo campo obrigatório e único por batedeira, definido pelo administrador em `/admin?view=lojas`). `lib/mock-data.ts`, `components/prototype-provider.tsx`, `app/operador/page.tsx` e `app/admin/page.tsx` foram alterados.

| Verificação | Resultado |
|---|---|
| `pnpm typecheck` | Aprovada, sem erros. |
| `pnpm test` | 22 testes aprovados (suíte inalterada). |
| `pnpm build` | Aprovado com Turbopack, mesmas quatro rotas. |

Verificação em navegador não realizada nesta sessão (extensão Claude in Chrome não conectada).

Os quatro arquivos alterados foram enviados ao [chat existente do v0](https://v0.app/vitors-projects-edcbface/chat/acaiconecta-jAWnqGHlb8w) via `sendChatMessage` do MCP. O v0 aplicou os arquivos, rodou `pnpm typecheck` (aprovado) e retornou os hashes SHA-256:

| Arquivo relativo a `prototypes/web/` | SHA-256 confirmado |
|---|---|
| `lib/mock-data.ts` | `59c8b91fba7c5c642ab74e123eb47bbc4fd69ab9d70a0b6a5850c13b015d84eb` |
| `components/prototype-provider.tsx` | `0f00c3153985df502b0b2d7e9b0a664306303037aafcf38bb110655948cc5081` |
| `app/operador/page.tsx` | `1fb447c9399a6860600f46d120bec151a9b535d980cea3127deaf53d6b00f8a3` |
| `app/admin/page.tsx` | `250272736e8c80cf82e3f5b5542cf08475b7bb9b01fef8cf503e334d0a12aa09` |

Hashes coincidem exatamente com os calculados localmente — nenhuma divergência. Não foi solicitada nova publicação em produção.

## Reenvio completo ao v0 em 16/09/2026 (noite)

Com autorização explícita do responsável pelo projeto, os 23 arquivos de código, configuração e testes alterados ou criados desde a sincronização anterior — incluindo as adições descritas em [Adições posteriores à verificação de 16/09](README.md#adições-posteriores-à-verificação-de-1609-pendentes-de-verificação-em-navegador-e-no-v0) (login/cadastro, endereços salvos, foto ilustrativa, painel de ajuda) e a recompressão da imagem com `sharp` — foram enviados ao [chat existente do v0](https://v0.app/vitors-projects-edcbface/chat/acaiconecta-jAWnqGHlb8w) via `sendChatMessage` do MCP, em 11 lotes (limitação de tamanho por mensagem, não do conteúdo).

O v0 aplicou cada lote nos caminhos correspondentes, confirmando por escrito quais arquivos foram alterados a cada envio. Ao final do último lote, rodou `pnpm typecheck` no ambiente remoto (aprovado, sem erros) e calculou o SHA-256 dos 23 arquivos aplicados. Os 23 hashes retornados coincidem exatamente com os hashes calculados localmente antes do envio — nenhuma divergência.

Arquivos sincronizados: `.gitignore`, `package.json`, `next.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/cliente/page.tsx`, `app/operador/page.tsx`, `app/admin/page.tsx`, `components/app-shell.tsx`, `components/modal.tsx`, `components/support-panel.tsx`, `components/photo-field.tsx`, `components/prototype-provider.tsx`, `components/customer-account.tsx`, `components/customer-order.tsx`, `components/order-panel.tsx`, `lib/mock-data.ts`, `lib/customer-session.ts`, `lib/order-presentation.ts`, `lib/use-view.ts`, `tests/customer-session.test.mjs`, `tests/orders.test.mjs`.

Este reenvio cobre a totalidade do código do protótipo desta revisão; a tabela de hashes da [sincronização original](#sincronização-com-o-v0) e do [reenvio parcial de 16/09 à noite](#correção-de-alinhamento-com-a-documentação-e-nova-sincronização-16092026-noite) fica substituída por este registro para fins de correspondência atual. Documentação local e a imagem binária não foram incluídas no envio, seguindo a prática já adotada nas sincronizações anteriores. Não foi solicitada nova publicação em produção; a Fase 2, a verificação em navegador destas telas e a validação com participantes permanecem pendentes.

## Feedback de usabilidade e ajustes de interface em 17/09/2026

O responsável pelo projeto testou o protótipo publicado e registrou feedback de usabilidade no Notion (página "Protótipo Açaí Conecta", 17/09/2026 19h43), pedindo alterações válidas para os 3 níveis de acesso. A decisão correspondente está registrada como [DEC-039](../../docs/product/decisions.md) em `decisions.md`. Mudanças aplicadas nesta rodada:

- **Login por tela dedicada (operador e administrador):** já estava implementado antes deste feedback (commit `034bd5b`, 17/09/2026 13h06); apenas confirmado, sem alteração de código.
- **Catálogo com dois tamanhos padrão:** `lib/mock-data.ts` não tem mais nenhum produto abaixo de 500 ml; o formulário de produto do operador (`app/operador/page.tsx`) trocou o campo livre de volume por uma seleção fixa entre 500 ml e 1.000 ml; `saveProduct` em `components/prototype-provider.tsx` valida o volume contra essa lista (`allowedProductVolumesMl`), não apenas na interface.
- **"Preciso de ajuda" sem repetição:** `components/customer-order.tsx` e `components/customer-account.tsx` deixaram de renderizar `SupportButton` próprio; `app/cliente/page.tsx` mantém um único ponto de entrada por página, com o código do pedido preenchido automaticamente quando há um pedido selecionado.
- **Abrir/fechar batedeira intuitivo:** o botão em `app/operador/page.tsx` agora usa cor de status (verde quando aberta, vermelho quando fechada — classes `status-toggle-open`/`status-toggle-closed` em `app/globals.css`) e abre uma confirmação antes de efetivar a mudança. Botões de navegação por seção (`Visão geral`/`Pedidos`/`Catálogo`/`Configurações` no operador e no administrador) ganharam destaque visual de estado ativo via `.demo-button[aria-pressed="true"]`.
- **Visão geral com métricas de negócio:** nova função `storeDailyMetrics` em `lib/order-presentation.ts` calcula lucro do dia (soma do total dos pedidos entregues hoje, fuso America/Belem), entregas hoje e pedidos aceitos hoje; exibidos na aba Visão geral do operador junto aos indicadores já existentes.
- **Produto tratado como algo íntegro:** os três banners de rodapé "Dados fictícios/Operação simulada/Administração simulada" (`DemoNotice`, usado em `app/cliente/page.tsx`, `app/operador/page.tsx` e `app/admin/page.tsx`) foram removidos, junto com o componente em `components/app-shell.tsx`. Rótulos como "E-mail fictício"/"Senha fictícia" viraram "E-mail"/"Senha"; textos de cabeçalho e descrição que diziam "simule o acesso"/"nesta demonstração"/"protótipo navegável" foram reescritos como comportamento real do produto. O aviso de pagamento no checkout do cliente deixou de mencionar "protótipo" e passou a descrever a regra real (Pix somente no momento da entrega, diretamente à batedeira). **Escopo mantido fora desta rodada, deliberadamente:** identificadores internos de ator usados em regra de negócio e trilha de auditoria — `"Administrador da demonstração"` e `"Cliente da demonstração"` (usados como nome padrão de ator e em filtros de eventos, ex. `app/operador/page.tsx` linha do `details` de "Cancelamentos e intervenções administrativas") — não foram renomeados nesta rodada, para não arriscar regressão em lógica de auditoria fora do pedido original; fica como pendência para uma revisão dedicada.

| Verificação | Resultado |
|---|---|
| `pnpm typecheck` | Aprovada, sem erros. |
| `pnpm test` | 22 testes aprovados (suíte inalterada). |
| `pnpm build` | Aprovado com Turbopack, mesmas quatro rotas (`/`, `/cliente`, `/operador`, `/admin`). |

Verificação em navegador não realizada nesta sessão (extensão Claude in Chrome não conectada) — o botão de confirmação de abrir/fechar batedeira, o seletor de tamanho do catálogo e a ausência de duplicidade do "Preciso de ajuda" ainda não foram exercitados visualmente.

### Sincronização com o v0 concluída em 18/09/2026

Com autorização do responsável pelo projeto, a sincronização dos 12 arquivos alterados na rodada de feedback de usabilidade (`lib/mock-data.ts`, `components/support-panel.tsx`, `app/cliente/page.tsx`, `lib/order-presentation.ts`, `app/admin/page.tsx`, `components/customer-order.tsx`, `app/operador/page.tsx`, `components/customer-account.tsx`, `components/app-shell.tsx`, `app/globals.css`, `app/page.tsx`, `components/prototype-provider.tsx`) foi retomada em 18/09/2026 após o reset do limite diário de mensagens do v0 (bloqueio original em 17/09/2026, registrado abaixo). Enviada ao [chat existente do v0](https://v0.app/vitors-projects-edcbface/chat/acaiconecta-jAWnqGHlb8w) via `sendChatMessage` do MCP, em 6 lotes de 2 arquivos.

O primeiro envio do lote 1 foi feito por engano com um anexo placeholder sem conteúdo real (erro operacional desta sessão, não do v0); identificado imediatamente pela falha de `pnpm typecheck` reportada pelo v0, e corrigido no envio seguinte com o conteúdo real. Os demais 5 lotes foram enviados sem esse problema.

O v0 aplicou cada lote no caminho correspondente e, ao final de cada um, rodou `pnpm typecheck` (aprovado em todos) e calculou o SHA-256 de cada arquivo aplicado. Os 12 hashes retornados coincidem exatamente com os hashes calculados localmente antes do envio — nenhuma divergência. No último lote, o v0 também rodou `pnpm test` (22 aprovados, 0 falhas) e `pnpm build` (aprovado, Turbopack, mesmas quatro rotas `/`, `/cliente`, `/operador`, `/admin`). Não foi solicitada publicação em produção.

A verificação em navegador destas telas (botão de confirmação de abrir/fechar batedeira, seletor de tamanho do catálogo, ausência de duplicidade do "Preciso de ajuda") e a validação com participantes continuam pendentes.

## Correção de dois gaps contra a anotação original do Notion em 18/09/2026

Nova comparação da implementação da rodada de 17/09/2026 contra o texto original registrado no Notion (não apenas o resumo em DEC-039) identificou dois pontos não totalmente atendidos:

- **Botão "Pausar entregas" sem o mesmo tratamento intuitivo:** o Notion cita "fechar batedeira" e "pausar entregas" juntos como exemplos de botão não intuitivo, mas só o primeiro recebeu cor de estado e confirmação na rodada anterior. Corrigido: `app/operador/page.tsx` agora usa um único estado `confirmToggle:'isOpen'|'deliveryAvailable'|null` para os dois botões, ambos com classes `status-toggle-open`/`status-toggle-closed` (verde/vermelho) e modal de confirmação antes de efetivar a mudança.
- **Nomes padrão ainda expunham "demonstração" ao usuário:** o DEC-039 tratou `"Administrador da demonstração"`/`"Cliente da demonstração"` como identificadores internos de auditoria, mas na prática apareciam como texto visível — barra "Conectado como" do admin (`app/admin/page.tsx`), painel "Acesso de clientes" do admin, e "Sua conta" do próprio cliente (`components/customer-account.tsx`) quando o nome não é informado. Corrigido: duas constantes centralizadas em `lib/mock-data.ts` (`adminActorName='Administrador do piloto'`, `guestCustomerName='Cliente'`), substituindo o literal antigo em `app/admin/page.tsx`, `app/operador/page.tsx` (inclusive no filtro de "Cancelamentos e intervenções administrativas", que dependia do mesmo literal para casar eventos), `components/prototype-provider.tsx` (4 pontos de geração de trilha de auditoria), `components/customer-account.tsx` e `components/customer-order.tsx`.

| Verificação | Resultado |
|---|---|
| `pnpm typecheck` | Aprovada, sem erros. |
| `pnpm test` | 22 testes aprovados (suíte inalterada). |
| `pnpm build` | Aprovado com Turbopack, mesmas quatro rotas (`/`, `/cliente`, `/operador`, `/admin`). |

Verificação em navegador não realizada nesta sessão (extensão Claude in Chrome não conectada).

### Tentativa de sincronização com o v0 bloqueada pelo limite diário (18/09/2026)

Com autorização do responsável pelo projeto, o envio dos 6 arquivos desta correção (`lib/mock-data.ts`, `app/admin/page.tsx`, `app/operador/page.tsx`, `components/prototype-provider.tsx`, `components/customer-account.tsx`, `components/customer-order.tsx`) ao [chat existente do v0](https://v0.app/vitors-projects-edcbface/chat/acaiconecta-jAWnqGHlb8w) via `sendChatMessage` do MCP foi tentado logo após a sincronização anterior (mesmo dia), mas retornou erro 403 "You have reached your daily message limit" já na primeira mensagem (lote 1 de 3, com `lib/mock-data.ts` e `app/admin/page.tsx`). Nenhum arquivo foi aplicado no v0 nesta tentativa. A sincronização remota desta correção permanece pendente até o reset do limite diário.

#### Tentativa bloqueada pelo limite diário em 17/09/2026 (histórico da rodada anterior)

A primeira tentativa desta sincronização, em 17/09/2026, foi iniciada via `sendChatMessage` do MCP, mas a primeira mensagem (lote 1 de 6, com `lib/mock-data.ts` e `components/support-panel.tsx`) retornou erro 403 "You have reached your daily message limit" — mesmo limite diário já registrado em [Substituição da foto ilustrativa, feita diretamente no v0](#substituição-da-foto-ilustrativa-feita-diretamente-no-v0-17092026). Nenhum arquivo foi aplicado no v0 nesta tentativa. O responsável pelo projeto optou por aguardar o reset do limite diário, retomado com sucesso em 18/09/2026 (acima).

#### Nova tentativa bloqueada pelo limite diário em 19/09/2026

Nova tentativa de reenvio do lote 1 de 3 (`lib/mock-data.ts` e `app/admin/page.tsx`), retomando a correção dos dois gaps acima, retornou novamente erro 403 "You have reached your daily message limit" — o limite diário de 18/09/2026 ainda não havia resetado neste horário. Nenhum arquivo foi aplicado no v0 nesta tentativa. A sincronização remota dos 6 arquivos desta correção permanece pendente.
