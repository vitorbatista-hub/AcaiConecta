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
