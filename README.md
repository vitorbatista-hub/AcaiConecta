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
- [PRD (2.7, aprovado)](docs/product/PRD.md)
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

- Interface: três áreas (cliente, batedeira e administração) com 51 testes sem banco e 35 com banco, tipos e build aprovados. Contas, sessões, batedeiras, catálogo e pedidos usam o MySQL local (etapa 4 de 7 da ADR-006); a sacola ainda fica no navegador; não há provedor de pagamento, estorno nem contestação (Épico 9).
- Arquitetura técnica: [aprovada](docs/product/arquitetura-tecnica.md) (DEC-046) como alvo, com as ADRs 001 (sessões) e 002 (tempo real) aprovadas e ainda não implementadas em `app/`; a ADR-004 (logs) é proposta e a ADR-003 (infraestrutura) está em revisão (DEC-061).
- Modelo de dados: schema SQL 0.11 (pagamento, estorno, contestação, bairros por batedeira, CPF/CNPJ da batedeira e redefinição de senha; 25/11/2026, validado em MySQL 8.0), dicionário de dados e [MER inicial](docs/product/mer-eer-inicial.md) alinhados; modelo aprovado na versão 0.7 (DEC-046).
- Backlog: [backlog priorizado do MVP](docs/product/backlog-mvp.md) aprovado (DEC-046)
- Aplicação: o código em [`app/`](app/README.md) deixou de ser protótipo e passou a ser a aplicação (DEC-053). A versão anterior com banco (DEC-051) permanece apenas no histórico do Git. Pendências principais: ADRs do provedor Pix e da persistência/hospedagem, banco de dados e sincronização entre usuários, Épico 9 (pagamento, estorno e contestação), política de privacidade e termos, e hospedagem (ADR-003).
- Piloto: pendente

## Organização do repositório

- `docs/`: documentação vigente de produto, pesquisa, banco de dados e arquitetura (ADRs).
- `docs/product/archive/`: documentos históricos, sem autoridade sobre os requisitos vigentes.
- `database/`: schema SQL oficial e modelo visual derivado.
- `app/`: código da aplicação web, com dependências próprias.

As regras de negócio vigentes são as do PRD e de `docs/product/decisions.md`; a interface não as substitui.

## Princípio de desenvolvimento

O projeto será desenvolvido de forma incremental. Cada fase deverá possuir objetivo, entregáveis e critérios de conclusão antes do início da fase seguinte.
