# Protótipo web — AçaíConecta

**Status: protótipo em elaboração, ainda não validado.**

Esta versão mais recente substitui a exportação anterior e foi fornecida para exploração visual na Fase 2 — Definição e Prototipação do Produto. Contém telas de entrada, cliente, operador de batedeira e administrador, com dados e ações simulados. A implementação do MVP não foi iniciada.

## Referência no v0

[Projeto do protótipo no v0](https://v0.app/vitors-projects-edcbface/chat/acaiconecta-jAWnqGHlb8w), informado pelo responsável pelo projeto.

Em 16/09/2026, 15 arquivos de código, configuração e testes foram enviados a este chat pelo MCP do v0. Os hashes SHA-256 retornados pelo v0 coincidiram com o manifesto local dos arquivos enviados. Tipos, 15 testes e build passaram também no ambiente remoto. Veja o [registro da sincronização](VERIFICATION.md#sincronização-com-o-v0).

Em 16/09/2026 (noite), os 23 arquivos de código alterados ou criados desde então — incluindo as adições descritas abaixo — foram reenviados ao mesmo chat em 11 lotes. O v0 aplicou todos nos caminhos correspondentes, `pnpm typecheck` foi aprovado no ambiente remoto e os hashes SHA-256 retornados coincidiram exatamente com os calculados localmente. Veja o [registro desta sincronização](VERIFICATION.md#reenvio-completo-ao-v0-em-16092026-noite).

[Preview do protótipo](https://acaiconecta.v0.build). O chat e o preview não representam publicação de produção ou validação com usuários. Alterações futuras no v0 ou no repositório não se sincronizam automaticamente — como já ocorreu antes com adições feitas após um envio e reenviadas apenas depois.

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

Para executar as verificações automatizadas (Node.js 24, validado com 24.15.0):

```sh
pnpm typecheck
pnpm test
pnpm build
```

Não há script de lint configurado. O build não ignora erros de TypeScript.

## Correções concluídas nesta revisão

- Estado compartilhado entre cliente, operador e administrador, restaurado por `sessionStorage` na mesma aba.
- Envio associado à batedeira da sacola, validação de catálogo e taxa no envio, mínimo de um litro, observações e troco somente em dinheiro.
- Matriz de transições, restrições por perfil na simulação, motivos obrigatórios, expiração em cinco minutos e proteção contra reenvio duplicado.
- Linha do tempo compartilhada, mensagens operacionais e intervenções com auditoria simulada.
- Gestão de catálogo e arquivamento, substituindo o módulo não aprovado de “Razas e custos”.
- Abertura e entrega independentes, taxa e estimativa configuráveis e horários semanais no fuso de Cametá.
- Modais nativos com nome acessível, Escape e restauração de foco; feedback de adição somente quando a ação é concluída.
- Analytics removido da renderização e verificação de tipos habilitada no build.

## Adições posteriores à verificação de 16/09 (pendentes de verificação em navegador e no v0)

Entre 14h11 e 14h32 de 16/09/2026, depois da revisão registrada abaixo, o código recebeu funcionalidades novas que ainda não foram exercitadas pelo navegador automatizado nem reenviadas ao v0:

- Login e cadastro simulados do cliente, com bloqueio e reativação de conta auditados pelo administrador (`components/customer-account.tsx`, `app/admin/page.tsx`).
- Endereços salvos do cliente, com endereço principal único (`lib/customer-session.ts`).
- Foto ilustrativa de produto e de batedeira, com upload local em JPEG/PNG/WebP até 500 KB, preservada somente na sessão (`components/photo-field.tsx`).
- Painel de ajuda com código do pedido copiável e contato de suporte opcional por e-mail, configurável pelo administrador (`components/support-panel.tsx`).

Tipos, build e os testes automatizados (agora 20, com 5 novos sobre sessão do cliente em `tests/customer-session.test.mjs`) foram revalidados localmente em 16/09/2026 após essas adições. Veja [Revalidação local](VERIFICATION.md#revalidação-local-em-16092026-tarde) em VERIFICATION.md. Essas telas já foram reenviadas ao v0 (ver seção acima); a verificação em navegador continua pendente — uma tentativa nesta sessão foi bloqueada pela ausência da extensão Claude in Chrome (ver [Tentativa de verificação em navegador](VERIFICATION.md#tentativa-de-verificação-em-navegador-em-16092026)).

## Verificação técnica

Revisão executada em 16/09/2026: 15 testes de domínio, checagem de tipos e build padrão com Turbopack aprovados. O build com Webpack também foi aprovado durante o diagnóstico do ambiente. O erro inicial de Turbopack deixou de ocorrer após substituir o link de `.next` para cache temporário por uma pasta local limpa; nenhuma mudança de bundler foi necessária no projeto. Esta contagem de testes e a navegação automatizada abaixo antecedem as adições descritas na seção anterior.

O navegador automatizado verificou descoberta, bloqueio abaixo de um litro, envio com taxa positiva, acompanhamento entre perfis até entrega, intervenção e cancelamento administrativo com auditoria, além de Escape e foco dos modais. Veja a [matriz de verificação](VERIFICATION.md) para evidências e limites.

## Limitações e próximos trabalhos da Fase 2

- Protótipo ainda não validado com usuários; esta revisão técnica não conclui a fase.
- Não há backend, MySQL/Prisma, autenticação, autorização real ou processamento de pagamentos. Os perfis são demonstrativos.
- A sessão é isolada por aba; não existe sincronização entre dispositivos. A expiração ocorre com a aplicação aberta e é reconciliada ao restaurar a sessão. Fechar a aba pode descartar os dados. Armazenamento indisponível mantém a simulação somente em memória.
- Login, cadastro, bloqueio e reativação do cliente agora são simulados no protótipo, com endereços salvos e um endereço principal (ver adições acima). Falta desenho/validação própria para recuperação de acesso — hoje apenas assistida via suporte, sem fluxo dedicado — e verificação em navegador e com usuários.
- O operador demonstrativo está vinculado à primeira batedeira; cadastros administrativos adicionais não criam contas autenticáveis.
- Cobertura fixa no Centro; configuração administrativa detalhada da cobertura e conjunto completo das métricas do piloto não estão representados. Indicadores existentes são calculados sobre a sessão e não comprovam resultados reais. Um campo de foto ilustrativa para produtos e batedeiras foi adicionado (upload local, sem armazenamento real fora da sessão), mas ainda não passou por verificação em navegador.
- Todas as imagens já são locais (`public/images/acai-tradicional.webp` e `public/placeholder.svg`); a configuração de host externo herdada da versão anterior foi removida de `next.config.mjs` em 16/09/2026. Em 16/09/2026 (noite), `acai-tradicional.webp` foi recomprimido com `sharp` (qualidade 80, mesma resolução 370×450), reduzindo de 24,7 KB para 19,8 KB sem perda visível, e `sharp` passou a ser devDependency para habilitar a otimização de imagens do Next.js em produção self-hosted; `next/image` já está em uso nos três locais que exibem a foto. Testes completos de acessibilidade, conexão instável e múltiplos navegadores permanecem pendentes.
- Os tipos da simulação não substituem o schema SQL: identificadores, nomes de campos e estruturas serão alinhados na implementação real.

## Correções de alinhamento com a documentação (16/09/2026, noite)

Após a revalidação registrada acima, uma revisão de coerência entre a documentação vigente e o protótipo identificou e corrigiu três divergências, sem alterar comportamento de negócio:

- Título da página e rodapé (`app/layout.tsx`, `app/page.tsx`) descreviam o produto como "marketplace", termo do PRD v1 (arquivado) que a Fase 2 abandonou junto com comissão, carteira e processamento de pagamento. Os textos foram ajustados para o enquadramento vigente de descoberta e pedidos.
- `next.config.mjs` mantinha um `remotePatterns` para o host de imagens da versão anterior, sem uso ativo no código atual (a única referência restante é uma migração defensiva de sessões antigas em `components/prototype-provider.tsx`). A configuração foi removida.
- `VERIFICATION.md` registrava os comandos de verificação com `npm`, divergindo do gerenciador oficial do projeto (pnpm, conforme `pnpm-lock.yaml` e as instruções acima). Os comandos foram corrigidos para `pnpm`.

Tipos, os 20 testes automatizados e o build (Turbopack, mesmas quatro rotas) foram revalidados localmente após as correções. Verificação em navegador e nova sincronização com o v0 seguem os mesmos limites já registrados nas seções anteriores.

## Revisão e integração

Esta versão deve ser registrada na branch de trabalho. A integração à `main` depende da revisão do conjunto completo de alterações que será incorporado. Versionar o rascunho não equivale a validar usabilidade, aprovar sua aderência ao PRD ou concluir a Fase 2.

As correções e a verificação desta revisão estão registradas no `CHANGELOG.md` e em `VERIFICATION.md`. Não foram criados commits, branches ou integrações nesta tarefa.
