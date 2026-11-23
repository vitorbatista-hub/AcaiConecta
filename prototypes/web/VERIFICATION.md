# Verificação do protótipo

Estado das verificações técnicas do protótipo. Elas não representam validação com usuários, cobertura integral do PRD, implementação do MVP nem conclusão da Fase 2. O histórico detalhado de cada rodada, incluindo as antigas sincronizações com o v0, está no `CHANGELOG.md` e no histórico do Git.

## Verificações automatizadas

Última execução: 28/09/2026, Node.js 24.

| Verificação | Resultado |
|---|---|
| `pnpm typecheck` | Aprovada, TypeScript estrito. |
| `pnpm test` | 24 testes aprovados (`tests/orders.test.mjs` e `tests/customer-session.test.mjs`). |
| `pnpm build` | Aprovado com Turbopack, rotas `/`, `/cliente`, `/operador` e `/admin`. |
| Lint | Não há comando configurado. |

## Matriz de cenários

| Requisito / fluxo | Evidência |
|---|---|
| Volume mínimo de 1 litro | Testes; navegador em 16/09 (500 ml bloqueados, 2 × 500 ml liberados). |
| Total, taxa e snapshot do pedido | Testes; navegador em 16/09 (2 × R$ 18,00 + R$ 2,50 = R$ 38,50). |
| Pix, dinheiro e troco | Testes: troco só em dinheiro e com valor suficiente. |
| Disponibilidade, bairro, catálogo e quantidade | Testes: bloqueios por estado da batedeira, entrega, bairro, mistura de lojas, produto e quantidade inválida. |
| Matriz de transições e perfis | Testes: saltos, vínculos incorretos, reabertura de estados terminais e ações de perfil indevido rejeitados. |
| Recusa, falha e cancelamento | Testes: motivo obrigatório e limites de cada perfil; navegador em 16/09 para cancelamento administrativo. |
| Expiração em cinco minutos | Testes: limite exato e sem eventos duplicados. Não houve espera real no navegador. |
| Idempotência do envio | Testes: mesma chave não duplica pedido. Não equivale a concorrência de backend. |
| Horários | Testes: fuso de Cametá, domingo zero, fechamento manual e próxima abertura. |
| Endereços salvos (DEC-040) | Testes: no máximo dois, alternância do principal, edição e rejeição de sessão com três. |
| Tamanhos de produto (DEC-042) | Validação em `saveProduct` contra `allowedProductVolumesMl`; sem teste automatizado próprio. |
| Faturamento do dia (DEC-043) | Teste: soma pedidos criados hoje, com taxa, exceto recusados, expirados, cancelados e com falha. |
| Métricas do piloto | Testes: tempos médios, motivos, recorrência e aceites anteriores ao cancelamento. |
| Fluxo entre perfis, modais e responsividade | Navegador em 16/09: pedido criado, recebido e acompanhado até a entrega; Escape e foco nos modais; sem rolagem horizontal em 390 × 844. |

## Acessibilidade (23/11/2026)

Chrome (Playwright) a 390 × 844, temas claro e escuro, protótipo em build de produção.

| Verificação | Resultado |
|---|---|
| axe-core (WCAG 2.0/2.1/2.2 A e AA e boas práticas) em 27 telas e modais: início, cliente (lista, catálogo, sacola, acesso, checkout, pedido), operador (login e 4 abas) e administrador (5 abas) | Sem violações após as correções desta rodada. |
| Correções feitas | Contraste do verde e do texto secundário nos dois temas, texto de selos laranja no tema escuro, texto fora de grupo em listas de definição, descrição de produto indisponível sem opacidade global, botão de menu com 44 px. |
| Teclado | Link "Pular para o conteúdo" é o primeiro foco; modal recebe o foco, mantém o Tab em seu interior, fecha com Escape e devolve o foco ao botão de origem; contorno de foco de 2 px. |
| Rodada completa de telas (23/11/2026, após o polimento) | axe sem violações em 390 e 1440 px, temas claro e escuro, incluindo minha conta, meus pedidos vazio, ajuda, login do operador, catálogo e edição de produto, configurações, as cinco abas do administrador e o cadastro assistido. |
| Reflow | Sem rolagem horizontal a 320 px na listagem do cliente. |

Não cobertos: leitor de tela real (NVDA, VoiceOver, TalkBack), outros navegadores (Firefox, Safari), dispositivos físicos, conexão instável, zoom de 200% e navegação por teclado completa nos painéis de operador e administrador. O axe detecta só parte dos problemas; esta rodada não comprova conformidade com a WCAG.

## Pendente de verificação em navegador

Adicionados depois da verificação em navegador de 16/09/2026 e cobertos apenas por tipos, testes e build:

- login e cadastro do cliente, bloqueio e reativação de conta;
- endereços salvos com edição e limite de dois;
- login de operador e administrador;
- foto ilustrativa de produto e de batedeira;
- painel de ajuda sem pontos de entrada repetidos;
- botões de abrir/fechar batedeira e pausar entregas com confirmação;
- seletor de tamanho no catálogo e visão geral com faturamento do dia.

## Fotos ilustrativas (DEC-038)

- Em uso: somente `public/images/acai-tradicional.webp`, sem marca d'água de negócio terceiro.
- Lote enviado ao v0 em 17/09/2026 (`acai1.webp`, `acai2.jpeg`, `acai3.jpeg`, `acai4.jpeg`, `acai-bowl.png`, `acai-cup.png`, `acai-family.png`): fora do repositório. Três delas, entre elas `acai4.jpeg`, têm marca d'água de "Açaí no Ponto"; as demais nunca tiveram a ausência de marca conferida individualmente. Nenhuma pode ser referenciada no código sem essa conferência, foto a foto.

## Validação com participantes

Testes de usabilidade considerados satisfatórios pelo responsável pelo projeto em 28/09/2026, sem ajustes de fluxo exigidos (DEC-045). Os testes foram feitos por desenvolvedores e por usuários que preferiram não se identificar.
