# Roadmap do AçaíConecta

**Status:** Fase 2 em andamento
**Última atualização:** Setembro de 2026

Este roadmap organiza o projeto em seis fases. As datas serão definidas somente após a validação do escopo e da capacidade de execução. A passagem entre fases depende dos critérios de conclusão, e não apenas do tempo transcorrido.

## Fase 1 — Descoberta e Validação do Problema

**Situação:** Concluída em 02/09/2026
**Evidência:** [`../research/validation-questionnaire.md`](../research/validation-questionnaire.md)

### Objetivo

Confirmar que o problema é relevante e que existe disposição real de batedeiras e consumidores para testar a solução.

### Entregáveis

- registro das observações sobre o mercado local;
- conversas práticas com batedeiras e consumidores;
- mapa simplificado do processo atual de pedido e entrega;
- lista de hipóteses validadas, rejeitadas ou ainda incertas;
- identificação de participantes potenciais para o piloto.

### Critérios de conclusão

- evidência suficiente de que o problema merece ser resolvido;
- pelo menos 3 batedeiras dispostas a avaliar ou testar a solução;
- riscos operacionais mais importantes identificados;
- decisão consciente de prosseguir, ajustar ou interromper.

## Fase 2 — Definição e Prototipação do Produto

**Situação:** Em andamento

### Objetivo

Transformar a visão do produto em uma especificação implementável e testada visualmente.

### Entregáveis

- PRD revisado e aprovado;
- decisões críticas registradas;
- fluxos de cliente, batedeira e administrador;
- protótipo navegável;
- testes de usabilidade;
- modelo conceitual e MER inicial;
- dicionário de dados inicial;
- arquitetura técnica proposta;
- backlog priorizado do MVP.

### Critérios de conclusão

- escopo do MVP definido;
- principais ambiguidades operacionais resolvidas;
- protótipo compreendido pelos usuários avaliados;
- modelo de dados e arquitetura revisados;
- backlog pronto para implementação.

## Fase 3 — Construção do MVP

### Objetivo

Implementar a menor solução confiável capaz de operar pedidos reais durante o piloto.

### Entregáveis

- aplicação web responsiva;
- área do cliente;
- painel da batedeira;
- painel administrativo;
- catálogo e disponibilidade;
- pedido e máquina de estados;
- notificações essenciais;
- dinheiro na entrega e Pix on-line após o aceite;
- confirmação de pagamento por webhook, expiração, renovação e devolução integral;
- métricas operacionais;
- testes e ambientes de homologação e produção.

### Critérios de conclusão

- fluxo completo aprovado em homologação;
- permissões dos perfis verificadas;
- pedidos duplicados e transições inválidas protegidos;
- webhooks idempotentes e conciliação do Pix verificados em homologação;
- backup, monitoramento e suporte preparados;
- critérios de lançamento do PRD atendidos;
- participantes do piloto treinados.

## Fase 4 — Piloto Controlado em Cametá

### Objetivo

Validar o produto e sua operação com pedidos reais em escala controlada.

### Entregáveis

- operação com 3 a 5 batedeiras;
- piloto de 4 a 6 semanas;
- acompanhamento dos primeiros pedidos;
- registro de incidentes e intervenções manuais;
- relatório de métricas;
- avaliação dos participantes;
- relatório final com recomendação.

### Critérios de conclusão

- métricas do piloto consolidadas;
- causas de falha e abandono compreendidas;
- viabilidade operacional avaliada;
- decisão formal de consolidar, ajustar, repetir, pivotar ou interromper.

## Fase 5 — Consolidação e Crescimento Local

### Objetivo

Corrigir as limitações identificadas e ampliar a operação sustentável em Cametá.

### Entregáveis possíveis

- melhorias de usabilidade e confiabilidade;
- estimativas de entrega aprimoradas;
- suporte mais estruturado;
- entrada gradual de novas batedeiras;
- definição e teste do modelo de receita;
- avaliações simples e recursos de retenção.

### Critérios de conclusão

- operação local estável;
- retenção de clientes e batedeiras comprovada;
- modelo financeiro minimamente sustentável;
- suporte capaz de acompanhar o crescimento;
- decisão fundamentada sobre expansão.

## Fase 6 — Expansão Regional

### Objetivo

Adaptar e replicar o modelo validado em outras cidades.

### Entregáveis possíveis

- estudo de cidades candidatas;
- critérios de entrada em novos mercados;
- parametrização de regras regionais;
- estratégia de aquisição de batedeiras;
- piloto controlado em uma segunda cidade;
- revisão de capacidade técnica e operacional.

### Critérios de conclusão

- segunda operação local validada;
- diferenças regionais documentadas;
- infraestrutura e suporte preparados para múltiplas cidades;
- expansão sustentável demonstrada.

## Regra de governança

Uma fase não será considerada concluída apenas porque seus arquivos ou funcionalidades foram criados. Os critérios de conclusão devem ser verificados, e a decisão de avançar deve ser registrada em `decisions.md` e no `CHANGELOG.md` quando for significativa.
