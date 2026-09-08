# Protótipo web — AçaíConecta

**Status: protótipo em elaboração, ainda não validado.**

Este código foi importado da versão descompactada fornecida para exploração visual na Fase 2 — Definição e Prototipação do Produto. Contém telas de entrada, cliente, operador de batedeira e administrador, com dados e ações simulados. A implementação do MVP não foi iniciada.

## Localização e fontes de verdade

`prototypes/web/` reúne o código, as imagens e as dependências desta experiência. O diretório `docs/product/archive/` é reservado ao histórico documental e não é adequado para um protótipo em desenvolvimento.

O [PRD vigente](../../docs/product/PRD.md), o [registro de decisões](../../docs/product/decisions.md), os [fluxos operacionais](../../docs/product/flows.md) e o [schema SQL](../../database/schema.sql) continuam sendo as referências do produto. O código importado não altera essas definições nem estabelece a estrutura da futura aplicação.

## Execução local

Requer Node.js compatível com as dependências declaradas em `package.json` e pnpm compatível com o lockfile de versão 9.

Na raiz do repositório:

```sh
cd prototypes/web
pnpm install --frozen-lockfile
pnpm dev
```

Abra o endereço informado pelo servidor. As rotas disponíveis são `/`, `/cliente`, `/operador` e `/admin`. Os perfis são acessados diretamente para demonstração, sem autenticação ou autorização reais. Use somente dados fictícios.

Para verificar tipos e gerar o build:

```sh
pnpm exec tsc --noEmit
pnpm build
```

O projeto importado não define scripts de teste ou lint. `next.config.mjs` contém `ignoreBuildErrors: true`, portanto um build bem-sucedido não comprova a correção dos tipos.

## Pendências conhecidas

Esta é uma revisão estática inicial, não uma validação completa do protótipo.

| Fonte no protótipo | Divergência ou limitação | Referência e impacto |
|---|---|---|
| `app/cliente/page.tsx` | Menciona pagamento e previsão de retirada. | O PRD, seções 10 e 14, e a DEC-014 definem somente entrega; o fluxo precisa ser ajustado antes da validação. |
| `app/cliente/page.tsx`, `app/operador/page.tsx`, `lib/mock-data.ts` | Confirmação simulada antecipa o preparo; estados simplificados permitem passar de pronto a entregue. | PRD, seção 12: preservar aceite, expiração, saída para entrega e exceções explícitas. |
| `app/cliente/page.tsx` | A confirmação não coleta endereço, forma de pagamento ou troco e não valida volume mínimo de 1 litro ou taxa por bairro. | PRD, seções 10 a 14: o fluxo de pedido ainda está incompleto. |
| `app/admin/page.tsx` | Exibe comissão média de 8% e envio de documentos pela batedeira. | DEC-033 e DEC-034: cadastro assistido sem documentos no sistema e piloto gratuito, sem comissão. |
| `lib/mock-data.ts`, `components/app-shell.tsx` | Valores monetários são representados em reais com ponto flutuante. | O schema e o PRD exigem centavos; este modelo não deve ser reutilizado no MVP sem correção. |
| `app/cliente/page.tsx`, `components/app-shell.tsx` | Avaliações, favoritos e distância aparecem como elementos de demonstração; links com `?view=` não estão conectados ao estado local das páginas. | Não representam funcionalidades aprovadas ou navegação integralmente funcional; revisar escopo e interações. |
| `lib/mock-data.ts`, `app/layout.tsx` | Imagens usam URLs externas e o layout inclui Vercel Analytics em produção. | Há dependência de rede e instrumentação herdada da exportação, sem decisão de infraestrutura do MVP. |
| `next.config.mjs`, `app/operador/page.tsx`, `components/app-shell.tsx` | Build ignora erros de tipos; `Order.status` inclui `cancelled`, ausente no tipo aceito por `StatusPill`. | A verificação de tipos precisa ser executada e as incompatibilidades corrigidas antes de considerar o código tecnicamente verificado. |

Não há integração com MySQL/Prisma, persistência de pedidos ou operação real. Indicadores e mensagens das telas são demonstrativos, não evidências do piloto.

## Revisão e integração

Esta versão deve ser registrada na branch de trabalho. A integração à `main` depende da revisão do conjunto completo de alterações que será incorporado. Versionar o rascunho não equivale a validar usabilidade, aprovar sua aderência ao PRD ou concluir a Fase 2.

Nesta organização foram revisados estaticamente os arquivos e a consistência documental. Build, verificação de tipos e navegação no navegador não foram executados: as dependências não estão instaladas e pnpm não está disponível neste ambiente.
