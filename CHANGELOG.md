# Changelog

Todas as mudanças significativas do AçaíConecta serão registradas neste arquivo em ordem cronológica inversa.

O formato é inspirado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Enquanto o produto não possuir uma versão lançada, as mudanças permanecerão na seção **Não lançado** ou serão agrupadas por marcos documentais.

## [Não lançado]

### Adicionado

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
