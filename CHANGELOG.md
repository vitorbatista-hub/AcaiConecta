# Changelog

Todas as mudanças significativas do AçaíConecta serão registradas neste arquivo em ordem cronológica inversa.

O formato é inspirado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Enquanto o produto não possuir uma versão lançada, as mudanças permanecerão na seção **Não lançado** ou serão agrupadas por marcos documentais.

## [Não lançado]

### Adicionado

- DEC-044 e DEC-045: PRD 2.6 aprovado e testes de usabilidade do protótipo considerados satisfatórios pelo responsável pelo projeto em 28/09/2026. PRD, roadmap, README e documentação do protótipo atualizados; a revisão humana do modelo de dados, da arquitetura e do backlog continua sendo o critério em aberto da Fase 2.
- DEC-042 e DEC-043, a partir de respostas do responsável pelo projeto: o catálogo aceita somente produtos de 500 ml e 1 L, validados pela aplicação, sem mudança no schema; e a visão geral do operador passa a exibir o "Faturamento do dia", total com taxa dos pedidos criados no dia, sem os que terminaram sem venda, no lugar de "Lucro do dia", que somava os pedidos entregues. No protótipo, `storeDailyMetrics` e o rótulo foram ajustados e ganharam teste (24 testes).
- ADR-001 (`docs/architecture/ADRs/`), primeira decisão arquitetural registrada: sessões opacas e tentativas de login persistidas no MySQL, com token guardado apenas como hash e tentativas expurgadas após a janela de limitação. Schema atualizado para 0.6 com as tabelas `sessoes` e `tentativas_login`, validado em MySQL 8.0; dicionário de dados, MER, arquitetura e backlog atualizados.
- DEC-041: o repositório passa a ser a única fonte de verdade do protótipo; o chat do v0 vira vitrine opcional, e a defasagem em relação a ele deixa de ser pendência.
- DEC-038: fotos ilustrativas com marca d'água ou identificação de negócio terceiro não podem ser referenciadas pelo código do protótipo ou do MVP; o estado de cada foto do lote enviado ao v0 está em `prototypes/web/VERIFICATION.md`.
- Login simulado de operador e de administrador no protótipo web (`components/role-login.tsx`), exigido antes de exibir os painéis `/operador` e `/admin`; ambos os perfis podem encerrar a sessão simulada pelo botão "Sair". Segue o mesmo padrão do login já existente do cliente: qualquer senha não vazia simula o acesso, sem verificação real nem persistência de senha. Fluxo do cliente não foi alterado — continua permitindo navegar o catálogo sem conta e pedindo login apenas ao enviar o pedido, decisão mantida deliberadamente para não aumentar o atrito na descoberta (PRD 8.1, 18.1). Os quatro arquivos alterados (`app/operador/page.tsx`, `app/admin/page.tsx`, `components/role-login.tsx`, `app/cliente/page.tsx`) foram reenviados ao chat existente do v0 via MCP, com hashes SHA-256 conferidos e `pnpm typecheck` aprovado no ambiente remoto.
- Login do operador corrigido a pedido do responsável pelo projeto: a primeira versão deixava o operador escolher a batedeira em uma lista suspensa, o que não representa um login real mesmo em simulação. Passou a pedir e-mail e senha fictícios, como o login do cliente e do administrador; a batedeira é identificada pelo e-mail de login do operador (`store.operatorEmail`, novo campo obrigatório e único, definido pelo administrador no cadastro assistido em `/admin?view=lojas`). Um `<details>` no formulário lista os e-mails de demonstração cadastrados, para facilitar o teste sem acesso ao código. 22 testes, tipos e build revalidados. Os quatro arquivos alterados (`lib/mock-data.ts`, `components/prototype-provider.tsx`, `app/operador/page.tsx`, `app/admin/page.tsx`) foram reenviados ao chat existente do v0 via MCP, com hashes SHA-256 conferidos e `pnpm typecheck` aprovado no ambiente remoto.
- Backlog priorizado do MVP (`docs/product/backlog-mvp.md`), com épicos derivados do PRD 2.5 e das histórias de usuário, priorização P0/P1/P2 por dependência técnica e rastreabilidade até o MER e a arquitetura técnica propostos; rascunho para revisão humana, sem aprovação de escopo. Roadmap da Fase 2 passou a linkar os quatro rascunhos (MER, dicionário de dados, arquitetura e backlog) e a registrar que a validação com participantes continua pendente.
- Login e cadastro simulados do cliente no protótipo web, com bloqueio/reativação de conta auditados pelo administrador, endereços salvos com endereço principal, foto ilustrativa de produto e de batedeira (upload local, sem armazenamento real) e painel de ajuda com código do pedido e contato de suporte opcional; 5 novos testes de sessão do cliente (total de 20). Feito após a verificação e a sincronização com o v0 de 16/09, sem verificação em navegador nem reenvio ao v0 (ver `VERIFICATION.md`).
- Referência do protótipo no v0 nos READMEs principal e do protótipo, com distinção entre o espaço de trabalho on-line e a exportação versionada; correspondência entre as versões ainda não verificada.
- Protótipo web inicial dos três perfis organizado em `prototypes/web/`, identificado como em elaboração e ainda não validado, com instruções de execução e divergências conhecidas em relação ao PRD 2.5.
- Fluxos operacionais do cliente, da batedeira e do administrador, incluindo exceções e matriz de transições do pedido.
- Dicionário de dados inicial do MVP reduzido, com relacionamentos, invariantes e políticas de retenção.
- Fluxo consolidado do processo atual de pedido e entrega, com limitações metodológicas explícitas.
- Questionário essencial e anônimo para validação da Fase 1 com batedeiras e consumidores.
- Schema SQL inicial do MVP para geração do modelo EER no MySQL Workbench.
- README com visão geral, estado atual e links da documentação.
- Roadmap com seis fases, entregáveis e critérios de conclusão.
- Registro centralizado de decisões tomadas e pendentes.
- Estrutura `docs/product/` para organizar a documentação do produto.
- Arquivo histórico do PRD 1.0.

### Alterado

- Revisão geral de coerência em 28/09/2026. PRD atualizado para 2.6, com aprovação formal prevista para depois dos testes de usabilidade: incorpora a DEC-040, a DEC-042, a DEC-043 e a ADR-001, esclarece que o administrador mantém a lista oficial de bairros e a batedeira escolhe os que atende, e atualiza os próximos passos. `database/acai_conecta.mwb` regenerado pelo responsável pelo projeto a partir do schema 0.7 e conferido contra o SQL (13 tabelas, colunas, índices e 17 chaves estrangeiras; restrições `CHECK` não são representadas pelo Workbench). DEC-039 deixou de citar a sincronização com o v0 como pendente, contradição com a DEC-041. Arquitetura deixou de tratar a autenticação como componente externo, em linha com a ADR-001. Backlog, fluxos, MER, dicionário de dados, roadmap e README sincronizados; item 5.5 do backlog (lista oficial de bairros) promovido a P0 por ser pré-requisito do 4.9. README e `VERIFICATION.md` do protótipo reescritos com o estado atual, sem os registros de sincronização com o v0, preservados no histórico do Git.
- ADR-001 revisada em 28/09/2026 a pedido do responsável pelo projeto, conforme boas práticas (NIST SP 800-63B, OWASP): limitação por e-mail a partir de 10 falhas em 15 minutos com espera crescente (1, 5 e 15 minutos), no lugar da proposta de 5 falhas com 15 minutos fixos; nova limitação por origem (50 falhas em 15 minutos, alta de propósito por causa do IP compartilhado das operadoras móveis), com o IP guardado apenas como HMAC-SHA-256; sessão do cliente de 30 dias renovada a cada uso e de operador/administrador de 12 horas; token novo a cada login; senha com mínimo de 8 caracteres e recusa de senhas comuns ou vazadas; hash calculado também para e-mail inexistente, para não revelar contas pelo tempo de resposta; retenção de 24 horas das tentativas. Schema atualizado para 0.7 com `tentativas_login.origem_hash` e o índice `idx_tentativas_login_origem_janela`, validado em MySQL 8.0; dicionário de dados, MER, arquitetura, backlog e README atualizados. O modelo `database/acai_conecta.mwb` continua na versão 0.4.
- DEC-040 confirmada pelo responsável pelo projeto em 28/09/2026, com limite de dois endereços salvos por cliente (um principal e um secundário). No protótipo, o limite passou a ser aplicado em `lib/customer-session.ts`, a conta do cliente ganhou edição de endereço e o envio do pedido deixa de oferecer salvar um terceiro endereço; 23 testes, tipos e build revalidados. Telefone de contato do pedido lido sempre do cadastro do cliente, sem cópia no pedido, confirmado. `docs/product/mer-eer-inicial.md` reduzido a modelo conceitual, diagrama, decisões e pendências: a descrição campo a campo, que duplicava o dicionário de dados, foi removida, e as notas exclusivas dela foram incorporadas ao dicionário; referências do backlog e da arquitetura atualizadas.
- Documentação alinhada ao schema 0.5 em 28/09/2026: `docs/product/mer-eer-inicial.md` reescrito com uma entidade por tabela e os nomes de coluna do schema (Bairro como entidade, Operador vinculado por `batedeiras.responsavel_id`, faixa estimada em `estimativa_minutos_min`/`max`, pedido com `codigo`, `expira_aceite_em` e snapshots do schema, telefone de contato lido do cliente em vez de copiado para o pedido) e sem a tabela residual de notificação deixada pela correção anterior; tentativas de login e encerramento de sessões passaram a constar como decisão de engenharia pendente em `arquitetura-tecnica.md`, a registrar em ADR. Referências de seção do backlog e da arquitetura atualizadas; README passa a apontar os rascunhos de arquitetura, MER e backlog; `decisions.md` registra que a DEC-040 segue provisória e que a pendência de nomes de ator da DEC-039 foi resolvida localmente. No protótipo, três textos visíveis que ainda mencionavam "demonstração/fictícios" foram reescritos e a constante sem uso `pilotNotice` foi removida; tipos, 22 testes e build revalidados, sem envio ao v0. Seções duplicadas deste changelog foram unificadas em ordem cronológica inversa.
- Corrigidas as 7 incoerências entre `database/schema.sql`, `docs/product/mer-eer-inicial.md` e o protótipo identificadas em 18/09/2026. Schema atualizado para 0.5: papel de usuário `BATEDEIRA` renomeado para `OPERADOR`; `usuarios.telefone` passou a ser opcional, com restrição `ck_usuarios_telefone_cliente` exigindo-o apenas para clientes; coluna `produtos.tipo` (GROSSO/FINO/OUTRO), sem respaldo no PRD, removida. Forma de pagamento unificada em `PIX_NA_ENTREGA` no MER e no protótipo; notificações passam a ser derivadas de `eventos_pedido`, sem tabela própria (PRD §15.2, DEC-035); motivo de bloqueio de conta registrado em `eventos_auditoria.detalhes`; endereços salvos formalizados na DEC-040 (provisória). Schema validado em MySQL 8.0; tipos, 22 testes e build do protótipo revalidados. O modelo `database/acai_conecta.mwb` continua na versão 0.4 e precisa ser regenerado no MySQL Workbench; os 5 arquivos do protótipo alterados (mais o teste) aumentam a pendência de sincronização com o v0, bloqueada por falta de créditos.
- Feedback de usabilidade do responsável pelo projeto aplicado ao protótipo (DEC-039): rótulos de "fictício/simulado/demonstração" removidos da interface, catálogo padronizado em 500 ml e 1 L, um único ponto de "Preciso de ajuda" por contexto, botões de abrir/fechar batedeira e de pausar entregas com indicação de estado e confirmação, e métricas de negócio na visão geral do operador; nomes padrão de ator deixaram de aparecer em texto visível. Sincronização com o v0 pendente (ver `VERIFICATION.md`).
- Foto ilustrativa única do protótipo (`public/images/acai-tradicional.webp`) substituída a pedido do responsável pelo projeto, feito diretamente no chat do v0 (sem passar pelo agente local). Nenhum código foi alterado no processo — o mapeamento em `lib/mock-data.ts` continua apontando todo o catálogo para esse único arquivo, como antes; quatro outras fotos pedidas para "espalhar pelos 3 acessos" (mais três encontradas no mesmo lote) ficaram órfãs, sem referência em nenhum código. Pelo menos parte dessas fotos, incluindo a que ficou em uso, aparenta ter origem em redes sociais de terceiros (marca d'água de um negócio de açaí não relacionado ao projeto em algumas delas); decisão sobre substituir por fotos originais/licenciadas continua pendente (ver `VERIFICATION.md`). Sincronizado para o repositório local via exportação completa do projeto do v0 (`prototypes/acai-conecta/`, fora do controle de versão), com hash SHA-256 conferido; tipos, 22 testes e build revalidados.
- Texto alternativo das fotos de batedeira na listagem do cliente passou a nomear cada estabelecimento (`Foto ilustrativa de açaí tradicional da {batedeira}`), em vez de um texto genérico idêntico para todas; documentação do protótipo (`README.md`) corrigida para refletir que as métricas de apoio do piloto (seção 5.4 do PRD) já estão implementadas em `lib/order-presentation.ts` e exibidas em `/admin`, contrariando o que constava anteriormente. Tipos, 22 testes e build revalidados; sem mudança de regra de negócio. Reenvio ao v0 e verificação em navegador destas alterações ainda pendentes.
- Imagem ilustrativa `acai-tradicional.webp` recomprimida com `sharp` (qualidade 80, mesma resolução 370×450), reduzindo de 24,7 KB para 19,8 KB sem perda visível perceptível; `sharp` adicionado como devDependency do protótipo para habilitar a otimização de imagens do `next/image` em produção self-hosted, ausente até então.
- Corrigidas três divergências entre a documentação vigente e o protótipo web: título e rodapé deixaram de descrever o produto como "marketplace" (termo do PRD v1 arquivado, incompatível com a ausência de comissão e processamento de pagamento no MVP reduzido); `next.config.mjs` deixou de referenciar o host de imagem externo herdado da versão anterior, sem uso ativo no código; e `VERIFICATION.md` passou a usar os comandos `pnpm`, alinhados ao gerenciador oficial do projeto. Tipos, 20 testes e build revalidados; sem mudança de regra de negócio. Os três arquivos corrigidos (`next.config.mjs`, `app/layout.tsx`, `app/page.tsx`) foram reenviados ao chat existente do v0 via MCP, com hashes SHA-256 conferidos e `pnpm typecheck` aprovado no ambiente remoto; os demais arquivos alterados desde a sincronização anterior continuam pendentes de reenvio (ver `VERIFICATION.md`).
- Documentação do protótipo (`README.md` e `VERIFICATION.md`) atualizada para registrar que as adições acima são posteriores à verificação e à sincronização com o v0 de 16/09/2026: tipos, build e os 20 testes foram revalidados localmente, mas a verificação em navegador e o reenvio ao v0 permanecem pendentes para as telas novas; a correspondência de hashes do envio anterior não vale mais para os arquivos alterados depois dele.
- Protótipo atualizado no chat existente do v0 via MCP, com 15 arquivos transferidos e hashes SHA-256 conferidos; tipos, 15 testes e build aprovados no ambiente remoto. Sincronização pontual registrada, sem conclusão da Fase 2.
- Correções do protótipo concluídas com estado compartilhado na sessão, validações e transições de pedidos, expiração, catálogo, controles independentes de disponibilidade, auditoria simulada e acessibilidade dos modais; 15 testes, tipos, build e fluxo principal no navegador verificados. Documentação e matriz de verificação atualizadas, mantendo a Fase 2 e a validação com usuários pendente.
- Protótipo anterior substituído pela exportação mais recente em `prototypes/web/`, preservando o código recebido; referência do v0 atualizada e limitações da nova versão documentadas, sem aprovação de mudanças de escopo ou conclusão da Fase 2.
- Schema SQL e modelo EER atualizados para 0.4, com convenção semanal de domingo (`0`) a sábado (`6`) e representação explícita da exibição de produtos temporariamente indisponíveis; o schema foi validado em MySQL 8.4.
- Modelo EER regenerado a partir do schema SQL 0.3 e documentação atualizada para refletir seu alinhamento estrutural.
- Integridade do histórico de pedidos reforçada para impedir remoção em cascata de eventos e perda da referência ao autor.
- Risco financeiro do PRD alinhado ao MVP sem provedor de pagamento.
- MVP reduzido ao núcleo de descoberta, catálogo e pedidos: Pix passa a ocorrer na entrega, sem processamento pela plataforma; fotografia, contestação formal, cadastro documental autônomo, múltiplos operadores e notificações externas saem do escopo inicial.
- PRD atualizado para 2.5, decisões anteriores substituídas formalmente e roadmap alinhado ao escopo reduzido.
- Schema SQL simplificado para remover infraestrutura financeira, documentação e evidência de entrega do MVP.
- Schema SQL e modelo EER atualizados para a versão 0.2, incorporando Pix on-line, documentação das batedeiras, volume mínimo, evidência e contestação de entrega.
- PRD atualizado para 2.4: Pix on-line passa a integrar o MVP, com cobrança após aceite, validade de dez minutos, uma renovação, crédito direto à batedeira e devolução integral.
- Decisões de Pix presencial substituídas formalmente; prazos de contestação, responsabilidade por tarifas e ausência de comissão por pedido consolidados.
- Roadmap atualizado para incluir integração e controles do Pix na construção do MVP, removendo sua previsão como recurso posterior.
- PRD atualizado para 2.3 com operação somente por entrega, regras de cancelamento e contestação, documentação obrigatória, área piloto, monetização e stack do MVP.
- Registro de decisões consolidado: respostas concluídas foram promovidas a decisões formais e substituídas por pendências específicas ainda abertas.
- Fase 1 concluída após validação com 3 batedeiras e 9 consumidores; Fase 2 iniciada.
- PRD atualizado para 2.2 com resultados das hipóteses e fila por ordem de criação.
- Registro de decisões atualizado com escolhas decorrentes da validação inicial.
- Roadmap do PRD alinhado ao `roadmap.md`, adotando oficialmente as fases 1 a 6.
- PRD 2.1 definido como documento vigente do produto.
- Referência ao PRD anterior atualizada para o caminho do arquivo histórico.
- Documentação Markdown definida como fonte oficial do projeto.

### Removido

- `docs/product/prompt-prototipacao.md`, prompt usado para gerar o protótipo no v0, obsoleto desde a DEC-041 e divergente das fontes vigentes (papel `BATEDEIRA`, `produtos.tipo`, dados rotulados como fictícios e 11 tabelas).
- Código sem uso no protótipo: `components/ui/button.tsx`, `lib/utils.ts`, `components.json` e 15 exportações de `lib/mock-data.ts`, entre elas uma constante que fixava "PRD 2.5"; dependências sem uso `@vercel/analytics`, `@base-ui/react`, `class-variance-authority`, `clsx` e `tailwind-merge`. Imagens do protótipo não foram alteradas.
- Pastas vazias `.agents/` e `.codex/` da raiz, fora do controle de versão.

## [2.0-documentacao] — 2026-09-01

### Adicionado

- PRD 2.0 com hipóteses, métricas, escopo do MVP e plano do piloto.
- Perfil e responsabilidades do administrador.
- Máquina de estados do pedido.
- Regras de catálogo, disponibilidade, aceite, expiração e cancelamento.
- Requisitos de entrega, notificações, autenticação, segurança e privacidade.
- Requisitos não funcionais e critérios de aceite.
- Hipóteses de monetização, riscos e critérios de prontidão.

## [1.0-documentacao] — 2026-08-25

### Adicionado

- Primeira versão do PRD do AçaíConecta.
- Definição inicial do problema, público, fluxos e roadmap.

### Alterado

- PRD convertido de PDF para Markdown para facilitar versionamento e revisão.
