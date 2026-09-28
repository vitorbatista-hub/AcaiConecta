# AçaíConecta

O **AçaíConecta** é uma plataforma digital em definição para conectar consumidores a batedeiras de açaí tradicional em Cametá/PA.

O produto pretende centralizar informações hoje dispersas, como disponibilidade, produtos, preços, horários e regiões atendidas, além de oferecer um fluxo estruturado para criação e acompanhamento de pedidos. A produção e a entrega continuarão sob responsabilidade de cada batedeira.

## Estado atual

A Fase 1 — Descoberta e Validação do Problema foi concluída. O projeto está na Fase 2 — Definição e Prototipação do Produto. O PRD 2.6 foi aprovado e o protótipo passou pelos testes de usabilidade; a implementação do MVP não foi iniciada.

Os trabalhos atuais incluem:

- revisão humana do modelo de dados, da arquitetura técnica e do backlog, já redigidos;
- encaminhamento dos gates externos: exigências jurídicas, privacidade, termos e política de retenção.

## Documentação

- [Protótipo web em elaboração — status, execução e pendências](prototypes/web/README.md)
- [Vitrine opcional do protótipo no v0 — pode estar defasada em relação ao repositório (DEC-041)](https://v0.app/vitors-projects-edcbface/chat/acaiconecta-jAWnqGHlb8w)
- [PRD vigente (2.6, aprovado)](docs/product/PRD.md)
- [Roadmap](docs/product/roadmap.md)
- [Registro de decisões](docs/product/decisions.md)
- [Decisões de arquitetura (ADRs)](docs/architecture/ADRs/)
- [Fluxos operacionais do MVP](docs/product/flows.md)
- [Questionário de validação da Fase 1](docs/research/validation-questionnaire.md)
- [Fluxo atual de pedido e entrega](docs/research/current-order-flow.md)
- [Schema SQL do MVP](database/schema.sql)
- [Dicionário de dados do MVP](docs/database/data-dictionary.md)
- [Modelo EER para MySQL Workbench (schema 0.7)](database/acai_conecta.mwb)
- [Histórico do PRD 1.0](docs/product/archive/PRD-v1.md)
- [Changelog](CHANGELOG.md)

O arquivo `database/schema.sql` é a fonte oficial da estrutura do banco de dados. O arquivo `database/acai_conecta.mwb` é sua representação visual derivada para consulta no MySQL Workbench e deverá ser regenerado após alterações estruturais no schema. O `.mwb` não representa as restrições `CHECK`; o banco deve ser criado sempre a partir do `schema.sql`.

## Local de validação

O produto será validado inicialmente em **Cametá, Pará**, com um grupo pequeno de batedeiras e consumidores. A expansão para outras cidades dependerá dos resultados operacionais e econômicos obtidos localmente.

## Situação da implementação

- Protótipo: três perfis navegáveis com dados simulados; tipos, 24 testes e build aprovados; testes de usabilidade concluídos (DEC-045); verificação automatizada em navegador das telas mais recentes pendente (ver [README do protótipo](prototypes/web/README.md))
- Arquitetura técnica: [proposta](docs/product/arquitetura-tecnica.md) em rascunho, pendente de revisão humana
- Modelo de dados: schema SQL 0.7, modelo EER, dicionário de dados e [MER inicial](docs/product/mer-eer-inicial.md) alinhados; sessões e tentativas de login decididas na [ADR-001](docs/architecture/ADRs/ADR-001-sessoes-e-tentativas-de-login.md); revisão humana do modelo pendente
- Backlog: [backlog priorizado do MVP](docs/product/backlog-mvp.md) em rascunho, pendente de revisão humana
- Aplicação: não iniciada
- Piloto: pendente

## Organização do repositório

- `docs/`: documentação vigente de produto, pesquisa, banco de dados e arquitetura (ADRs).
- `docs/product/archive/`: documentos históricos, sem autoridade sobre os requisitos vigentes.
- `database/`: schema SQL oficial e modelo visual derivado.
- `prototypes/web/`: código e recursos do protótipo web em elaboração, com dependências próprias e dados simulados.

O protótipo serve à exploração visual da Fase 2. Suas telas e simulações não substituem o PRD nem representam aprovação das regras de negócio ou da arquitetura do MVP.

## Princípio de desenvolvimento

O projeto será desenvolvido de forma incremental. Cada fase deverá possuir objetivo, entregáveis e critérios de conclusão antes do início da fase seguinte.
