# AçaíConecta

O **AçaíConecta** é uma plataforma digital em definição para conectar consumidores a batedeiras de açaí tradicional em Cametá/PA.

O produto pretende centralizar informações hoje dispersas, como disponibilidade, produtos, preços, horários e regiões atendidas, além de oferecer um fluxo estruturado para criação e acompanhamento de pedidos. A produção e a entrega continuarão sob responsabilidade de cada batedeira.

## Estado atual

As fases 1 — Descoberta e Validação do Problema e 2 — Definição e Prototipação do Produto foram concluídas. O projeto está na Fase 3 — Construção do MVP (DEC-049). A aplicação web está em [`app/`](app/README.md) (DEC-053).

Os trabalhos atuais incluem:

- escolha da infraestrutura de hospedagem, banco, arquivos e observabilidade e do provedor de pagamento Pix, a registrar em ADR;
- pagamento (Pix on-line e dinheiro), estorno, contestação e atendimento a bairros urbanos, decididos em 25/11/2026 (DEC-056 a DEC-059); PRD 2.7 aprovado em 25/11/2026 (DEC-060);
- implementação do backlog priorizado do MVP;
- política de privacidade e termos de uso, obrigatórios antes do piloto.

## Documentação

- [Aplicação web — execução, acesso da equipe e limitações](app/README.md)
- [PRD (2.8)](docs/product/PRD.md)
- [Roadmap](docs/product/roadmap.md)
- [Registro de decisões](docs/product/decisions.md)
- [Decisões de arquitetura (ADRs)](docs/architecture/ADRs/)
- [Fluxos operacionais do MVP](docs/product/flows.md)
- [Questionário de validação da Fase 1](docs/research/validation-questionnaire.md)
- [Fluxo atual de pedido e entrega](docs/research/current-order-flow.md)
- [Schema SQL do MVP](database/schema.sql)
- [Dicionário de dados do MVP](docs/database/data-dictionary.md)
- [Histórico do PRD 1.0](docs/product/archive/PRD-v1.md)
- [Changelog](CHANGELOG.md)

O arquivo `database/schema.sql` é a única fonte oficial da estrutura do banco de dados. O antigo modelo visual `.mwb` foi removido (DEC-061); se for preciso um diagrama, gere-o a partir do `schema.sql`.

## Local de validação

O produto será validado inicialmente em **Cametá, Pará**, com um grupo pequeno de batedeiras e consumidores. A expansão para outras cidades dependerá dos resultados operacionais e econômicos obtidos localmente.

## Situação da implementação

- Interface: três áreas (cliente, batedeira e administração) com 54 testes sem banco e 41 com banco, tipos e build aprovados. Contas, sessões, batedeiras, catálogo, pedidos, administração, suporte e métricas usam o MySQL local (etapa 5 de 7 da ADR-006); só a sacola fica no navegador. Não há provedor de pagamento, estorno nem contestação (Épico 9, adiado pela DEC-066), serviço de e-mail (DEC-064) nem envio de documentos (DEC-065).
- Arquitetura técnica: [aprovada](docs/product/arquitetura-tecnica.md) (DEC-046) como alvo; ADR-001 (sessões) implementada em parte, ADR-002 (tempo real) e ADR-004 (logs) aprovadas e não implementadas, ADR-003 (infraestrutura) em revisão, ADR-005 (Pix) adiada e ADR-006 (persistência) em andamento.
- Modelo de dados: schema SQL 0.12, dicionário de dados e [MER inicial](docs/product/mer-eer-inicial.md) alinhados; modelo aprovado na versão 0.7 (DEC-046).
- Backlog: [backlog priorizado do MVP](docs/product/backlog-mvp.md) aprovado (DEC-046)
- Aplicação: o código em [`app/`](app/README.md) deixou de ser protótipo e passou a ser a aplicação (DEC-053). A versão anterior com banco (DEC-051) permanece apenas no histórico do Git. Pendências principais: tempo real, logs, hospedagem (ADR-003), serviço de e-mail, documentos da batedeira, Pix (Épico 9) e política de privacidade e termos.
- Piloto: pendente

## Organização do repositório

- `docs/`: documentação vigente de produto, pesquisa, banco de dados e arquitetura (ADRs).
- `docs/product/archive/`: documentos históricos, sem autoridade sobre os requisitos vigentes.
- `database/`: schema SQL oficial.
- `app/`: código da aplicação web, com dependências próprias.

As regras de negócio vigentes são as do PRD e de `docs/product/decisions.md`; a interface não as substitui.

## Princípio de desenvolvimento

O projeto será desenvolvido de forma incremental. Cada fase deverá possuir objetivo, entregáveis e critérios de conclusão antes do início da fase seguinte.
