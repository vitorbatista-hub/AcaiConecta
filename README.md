# AçaíConecta

O **AçaíConecta** é uma plataforma digital em definição para conectar consumidores a batedeiras de açaí tradicional em Cametá/PA.

O produto pretende centralizar informações hoje dispersas, como disponibilidade, produtos, preços, horários e regiões atendidas, além de oferecer um fluxo estruturado para criação e acompanhamento de pedidos. A produção e a entrega continuarão sob responsabilidade de cada batedeira.

## Estado atual

A Fase 1 — Descoberta e Validação do Problema foi concluída. O projeto está na Fase 2 — Definição e Prototipação do Produto; ainda não existe aplicação implementada.

Os trabalhos atuais incluem:

- validação dos fluxos documentados do MVP reduzido;
- criação do protótipo navegável;
- revisão do modelo de dados;
- definição da arquitetura técnica;
- preparação do backlog do MVP;

## Documentação

- [PRD vigente](docs/product/PRD.md)
- [Roadmap](docs/product/roadmap.md)
- [Registro de decisões](docs/product/decisions.md)
- [Fluxos operacionais do MVP](docs/product/flows.md)
- [Questionário de validação da Fase 1](docs/research/validation-questionnaire.md)
- [Fluxo atual de pedido e entrega](docs/research/current-order-flow.md)
- [Schema SQL do MVP](database/schema.sql)
- [Dicionário de dados do MVP](docs/database/data-dictionary.md)
- [Modelo EER 0.4 para MySQL Workbench](database/acai_conecta.mwb)
- [Histórico do PRD 1.0](docs/product/archive/PRD-v1.md)
- [Changelog](CHANGELOG.md)

O arquivo `database/schema.sql` é a fonte oficial da estrutura do banco de dados. O arquivo `database/acai_conecta.mwb` é sua representação visual derivada para consulta no MySQL Workbench e deverá ser regenerado após alterações estruturais no schema.

## Local de validação

O produto será validado inicialmente em **Cametá, Pará**, com um grupo pequeno de batedeiras e consumidores. A expansão para outras cidades dependerá dos resultados operacionais e econômicos obtidos localmente.

## Situação da implementação

- Protótipo: pendente
- Arquitetura técnica: pendente
- Modelo de dados: schema SQL, dicionário de dados e modelo EER 0.4 atualizados
- Aplicação: não iniciada
- Piloto: pendente

## Princípio de desenvolvimento

O projeto será desenvolvido de forma incremental. Cada fase deverá possuir objetivo, entregáveis e critérios de conclusão antes do início da fase seguinte.
