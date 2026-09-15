# Protótipo web — AçaíConecta

**Status: protótipo em elaboração, ainda não validado.**

Esta versão mais recente substitui a exportação anterior e foi fornecida para exploração visual na Fase 2 — Definição e Prototipação do Produto. Contém telas de entrada, cliente, operador de batedeira e administrador, com dados e ações simulados. A implementação do MVP não foi iniciada.

## Referência no v0

[Projeto do protótipo no v0](https://v0.app/vitors-projects-edcbface/chat/acaiconecta-jAWnqGHlb8w), informado pelo responsável pelo projeto.

O endereço aponta para o espaço de trabalho do protótipo no v0 e não comprova uma publicação de produção ou validação com usuários. Seu conteúdo não pôde ser inspecionado pela ferramenta de consulta nesta atualização; a correspondência entre a versão on-line e esta exportação permanece não verificada. Alterações no v0 não atualizam automaticamente os arquivos versionados neste repositório.

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
| `app/cliente/page.tsx` | O envio depende do catálogo selecionado, que é limpo ao fechá-lo; a batedeira deve ser obtida da sacola. | O fluxo pode terminar sem resposta ou associar itens ao estabelecimento incorreto. |
| Páginas dos três perfis | Pedidos e disponibilidade ficam em estados locais separados. | A simulação ainda não permite validar o ciclo completo entre cliente, operador e administrador. |
| `lib/mock-data.ts`, `app/operador/page.tsx` | `applyTransition` não aplica a matriz de transições, o prazo ou motivos obrigatórios; não há expiração automática. | PRD, seção 12: aceite vencido, recusa e falha sem motivo foram reproduzidos em verificações pontuais das funções. |
| `app/cliente/page.tsx`, `components/app-shell.tsx` | Cancelamento sem ação, navegação incompleta após envio e chamadas de `useToast` fora do provedor correspondente. | Ações essenciais e feedback ainda precisam de correção. Navegação móvel e histórico também precisam de validação. |
| `app/operador/page.tsx` | Gestão de catálogo substituída por “Razas e custos”; compras tratadas como produção, conversão fixa para litros e períodos sem filtragem. | Módulo sem decisão registrada no PRD vigente; não representa ampliação aprovada do MVP. Gestão de catálogo permanece pendente. |
| `app/operador/page.tsx` | Abertura e entrega vinculadas automaticamente; pedidos aceitos apresentados como “Entrada no caixa”. | PRD, seções 10 e 14: controles independentes e ausência de confirmação financeira pela plataforma. |
| `app/cliente/page.tsx` | Entrega gratuita e faixa estimada fixadas na apresentação; observação de portaria inserida automaticamente; troco pode acompanhar Pix. | Revisar transparência dos valores, instruções do cliente e regras de pagamento antes de validar o fluxo. |
| `app/admin/page.tsx` | Mudanças administrativas apenas locais, sem inclusão de eventos de auditoria; cadastro e intervenções incompletos. | PRD, seções 8, 16 e 19: a simulação administrativa ainda não cobre os fluxos exigidos. |
| `app/cliente/page.tsx` | Modais sem gestão de foco, fechamento por Escape ou nome acessível associado. | Revisão de acessibilidade e teste por teclado pendentes. |
| `lib/mock-data.ts`, `app/layout.tsx`, `next.config.mjs` | Imagens externas, Analytics herdado e build configurado para ignorar erros de tipos. | Não estabelecem infraestrutura aprovada; build isolado não comprova correção dos tipos. |

Esta versão avança em volumes explícitos, valores em centavos, endereço, pagamento na entrega, mínimo de um litro e estados completos declarados. Esses avanços não eliminam as limitações acima.

Não há integração com MySQL/Prisma, persistência de pedidos ou operação real. Indicadores e mensagens das telas são demonstrativos, não evidências do piloto.

## Revisão e integração

Esta versão deve ser registrada na branch de trabalho. A integração à `main` depende da revisão do conjunto completo de alterações que será incorporado. Versionar o rascunho não equivale a validar usabilidade, aprovar sua aderência ao PRD ou concluir a Fase 2.

Nesta substituição foram revisados estaticamente o código e a consistência documental, e executadas verificações pontuais das funções de domínio com Node.js. Build, verificação completa de tipos e navegação no navegador não foram executados: as dependências, pnpm e agent-browser não estão disponíveis neste ambiente. As falhas conhecidas foram preservadas nesta importação e precisam ser corrigidas antes da validação do protótipo.
