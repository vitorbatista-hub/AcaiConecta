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

Testes de usabilidade considerados satisfatórios pelo responsável pelo projeto em 28/09/2026, sem ajustes de fluxo exigidos (DEC-045). Participantes, cenários e dificuldades observadas ainda não foram registrados no repositório.
