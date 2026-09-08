# AçaíConecta

O **AçaíConecta** é uma plataforma digital em definição para conectar consumidores a batedeiras de açaí tradicional em Cametá/PA.

O produto pretende centralizar informações hoje dispersas, como disponibilidade, produtos, preços, horários e regiões atendidas, além de oferecer um fluxo estruturado para criação e acompanhamento de pedidos. A produção e a entrega continuarão sob responsabilidade de cada batedeira.

## Estado atual

A Fase 1 — Descoberta e Validação do Problema foi concluída. O projeto está na Fase 2 — Definição e Prototipação do Produto. Há um protótipo de interface em elaboração, ainda não validado; a implementação do MVP não foi iniciada.

Os trabalhos atuais incluem:

- validação dos fluxos documentados do MVP reduzido;
- criação do protótipo navegável;
- revisão do modelo de dados;
- definição da arquitetura técnica;
- preparação do backlog do MVP;

## Documentação

- [Protótipo web em elaboração — status, execução e pendências](prototypes/web/README.md)
- [Referência do protótipo no v0 — ainda não validado](https://v0.app/vitorbatista-hub/chat/acaiconecta-jAWnqGHlb8w)
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

- Protótipo: versão inicial em elaboração, ainda não validada; revisão de aderência ao PRD e testes de usabilidade pendentes
- Arquitetura técnica: pendente
- Modelo de dados: schema SQL, dicionário de dados e modelo EER 0.4 atualizados
- Aplicação: não iniciada
- Piloto: pendente

## Organização do repositório

- `docs/`: documentação vigente de produto, pesquisa e banco de dados.
- `docs/product/archive/`: documentos históricos, sem autoridade sobre os requisitos vigentes.
- `database/`: schema SQL oficial e modelo visual derivado.
- `prototypes/web/`: código e recursos do protótipo web em elaboração, com dependências próprias e dados simulados.

O protótipo serve à exploração visual da Fase 2. Suas telas e simulações não substituem o PRD nem representam aprovação das regras de negócio ou da arquitetura do MVP.

## Princípio de desenvolvimento

O projeto será desenvolvido de forma incremental. Cada fase deverá possuir objetivo, entregáveis e critérios de conclusão antes do início da fase seguinte.
