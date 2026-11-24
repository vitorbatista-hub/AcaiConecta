# AçaíConecta

O **AçaíConecta** é uma plataforma digital em definição para conectar consumidores a batedeiras de açaí tradicional em Cametá/PA.

O produto pretende centralizar informações hoje dispersas, como disponibilidade, produtos, preços, horários e regiões atendidas, além de oferecer um fluxo estruturado para criação e acompanhamento de pedidos. A produção e a entrega continuarão sob responsabilidade de cada batedeira.

## Estado atual

As fases 1 — Descoberta e Validação do Problema e 2 — Definição e Prototipação do Produto foram concluídas. O projeto está na Fase 3 — Construção do MVP (DEC-049). A aplicação web está em [`app/`](app/README.md) (DEC-053).

Os trabalhos atuais incluem:

- escolha da infraestrutura de hospedagem, banco, arquivos e observabilidade, a registrar em ADR (primeira tarefa da fase);
- implementação do backlog priorizado do MVP;
- política de privacidade e termos de uso, obrigatórios antes do piloto.

## Documentação

- [Aplicação web — execução, acesso da equipe e limitações](app/README.md)
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

- Interface: três áreas (cliente, batedeira e administração) com 32 testes, tipos e build aprovados; testes de usabilidade concluídos (DEC-045). O acesso da equipe é autenticado no servidor, mas pedidos e catálogo ainda ficam no navegador, sem banco de dados.
- Arquitetura técnica: [proposta aprovada](docs/product/arquitetura-tecnica.md) (DEC-046), com as ADRs 001 e 002
- Modelo de dados: schema SQL 0.7, modelo EER, dicionário de dados e [MER inicial](docs/product/mer-eer-inicial.md) alinhados; sessões e tentativas de login decididas na [ADR-001](docs/architecture/ADRs/ADR-001-sessoes-e-tentativas-de-login.md); aprovados (DEC-046)
- Backlog: [backlog priorizado do MVP](docs/product/backlog-mvp.md) aprovado (DEC-046)
- Aplicação: o código em [`app/`](app/README.md) deixou de ser protótipo e passou a ser a aplicação (DEC-053). A versão anterior com banco (DEC-051) permanece apenas no histórico do Git. Pendências principais: persistência e sincronização entre usuários (banco), contas de cliente com senha, política de privacidade e termos, e hospedagem (ADR-003).
- Piloto: pendente

## Organização do repositório

- `docs/`: documentação vigente de produto, pesquisa, banco de dados e arquitetura (ADRs).
- `docs/product/archive/`: documentos históricos, sem autoridade sobre os requisitos vigentes.
- `database/`: schema SQL oficial e modelo visual derivado.
- `app/`: código da aplicação web, com dependências próprias.

As regras de negócio vigentes são as do PRD e de `docs/product/decisions.md`; a interface não as substitui.

## Princípio de desenvolvimento

O projeto será desenvolvido de forma incremental. Cada fase deverá possuir objetivo, entregáveis e critérios de conclusão antes do início da fase seguinte.
