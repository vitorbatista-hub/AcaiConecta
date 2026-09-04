# Changelog

Todas as mudanças significativas do AçaíConecta serão registradas neste arquivo em ordem cronológica inversa.

O formato é inspirado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Enquanto o produto não possuir uma versão lançada, as mudanças permanecerão na seção **Não lançado** ou serão agrupadas por marcos documentais.

## [Não lançado]

### Adicionado

- Fluxos operacionais do cliente, da batedeira e do administrador, incluindo exceções e matriz de transições do pedido.
- Dicionário de dados inicial do MVP reduzido, com relacionamentos, invariantes e políticas de retenção.
- Orientações para contextualização silenciosa, análise de consistência e feedback contínuo de fase nas sessões de agentes.
- Fluxo consolidado do processo atual de pedido e entrega, com limitações metodológicas explícitas.
- Questionário essencial e anônimo para validação da Fase 1 com batedeiras e consumidores.
- Schema SQL inicial do MVP para geração do modelo EER no MySQL Workbench.
- README com visão geral, estado atual e links da documentação.
- Roadmap com seis fases, entregáveis e critérios de conclusão.
- Registro centralizado de decisões tomadas e pendentes.
- Estrutura `docs/product/` para organizar a documentação do produto.
- Arquivo histórico do PRD 1.0.

### Alterado

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
