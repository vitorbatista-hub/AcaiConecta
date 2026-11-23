# ADR-003 — Infraestrutura de hospedagem, banco, arquivos e observabilidade

**Estado:** Proposta em revisão (aguarda comparação, prova de conceito e aprovação do responsável pelo projeto)
**Data:** 2026-11-23 (revisada em 2026-11-23; ver "Revisão da proposta")
**Responsável pela decisão:** responsável pelo projeto (modelo de hospedagem: PaaS com contêiner; orçamento sem restrição definida); provedor concreto definido a partir de recomendação técnica
**Relacionados:** PRD 2.6 §18, §24.2 e §26; DEC-049; [ADR-001](ADR-001-sessoes-e-tentativas-de-login.md); [ADR-002](ADR-002-atualizacao-em-tempo-real.md); [arquitetura técnica proposta](../../product/arquitetura-tecnica.md) §8–§10

## Contexto

A DEC-049 define a escolha da infraestrutura como primeira tarefa da Fase 3, antes de qualquer código de produção. Requisitos que restringem a escolha:

- aplicação Next.js em processo persistente ou contêiner, capaz de manter conexões SSE abertas por longos períodos (ADR-002);
- MySQL 8+ gerenciado, com backup automático diário e teste de restauração documentado (PRD §18.3 e §26);
- armazenamento de objetos compatível com S3 para fotos, nunca blobs no banco (arquitetura §8);
- ambientes de homologação e produção separados (backlog 1.4);
- logs de erro centralizados com identificador de requisição (backlog 1.5);
- minimização de dados pessoais e de dependências de fornecedor (PRD §23).

O responsável pelo projeto escolheu o modelo **PaaS com contêiner** e não definiu teto de orçamento. No levantamento feito em 23/11/2026, o MySQL gerenciado com backup incluso apareceu de forma clara apenas na DigitalOcean; Render e Fly.io oferecem banco gerenciado só para PostgreSQL, e a Railway não mostrou recurso de backup específico para MySQL.

## Decisão proposta

1. **Aplicação:** DigitalOcean App Platform, executando a aplicação Next.js como contêiner (Dockerfile no repositório), com um serviço para homologação e outro para produção.
2. **Banco:** DigitalOcean Managed MySQL 8, um cluster por ambiente, com backup diário automático. A restauração será testada e documentada antes do piloto (backlog 1.6). Acesso apenas pela rede privada e por conexão TLS.
3. **Arquivos:** DigitalOcean Spaces (compatível com S3), com buckets separados por ambiente, acessado pela aplicação por interface S3 padrão para permitir troca de provedor.
4. **Observabilidade:** logs estruturados em JSON na saída padrão, coletados pela plataforma, com identificador de requisição por pedido (PRD §18.5), e rastreamento de erros por um serviço dedicado a definir na implementação, sem enviar dados pessoais nem segredos.
5. **Segredos:** variáveis de ambiente da plataforma, nunca versionadas; nenhuma variável privada exposta ao cliente.
6. **Portabilidade:** a aplicação depende somente de contêiner, MySQL e API S3, sem recursos proprietários do provedor, de modo que migrar exija mudança de configuração, não de código.

## Alternativas consideradas

- **Railway, Render ou Fly.io com MySQL como serviço próprio.** Descartada como principal: o MySQL seria autogerido em disco persistente, com backup e restauração por nossa conta, o que contraria o critério de backup do PRD §26 sem ganho no piloto.
- **VPS própria com Docker.** Descartada por decisão do responsável: transfere atualização, TLS, backup e monitoramento para o projeto.
- **AWS, GCP ou Azure.** Descartada por ora: exigiriam mais operação e custo que um piloto de 3 a 5 batedeiras justifica. A portabilidade do item 6 mantém essa porta aberta.
- **Funções serverless (ex.: Vercel).** Descartada pela ADR-002 por causa das conexões SSE.

## Revisão da proposta (23/11/2026)

O responsável pelo projeto pediu a revisão da ADR e decidiu **comparar provedores antes de aprovar** e **validar o escolhido com uma prova de conceito descartável** (DEC-052). Os dados abaixo vêm de páginas oficiais dos provedores, consultadas em 23/11/2026, e de fontes secundárias quando indicado. Onde não consegui confirmar, está escrito. Nenhum preço aqui é cotação; conferir nas páginas oficiais antes de decidir.

### O que a revisão mudou

1. **A premissa "só a DigitalOcean oferece MySQL gerenciado com backup" estava incompleta.** Ela vale para os PaaS comparados (Railway, Render, Fly.io). Google Cloud (Cloud SQL para MySQL) e Magalu Cloud (DBaaS MySQL) também oferecem. AWS e Azure não foram avaliados nesta revisão.
2. **A região virou critério.** A [disponibilidade regional da DigitalOcean](https://docs.digitalocean.com/platform/regional-availability/) não lista São Paulo para App Platform, Managed MySQL nem para os demais produtos pesquisados. Uma fonte de terceiros afirma o contrário, sem respaldo na documentação oficial.
3. **O SSE na App Platform não está confirmado.** Há relatos de [limite de cerca de 100 s por requisição](https://www.digitalocean.com/community/questions/how-to-resolve-the-100s-request-timeout-of-digital-ocean-s-app-is-there-a-way-to-increase-the-timeout-or-something-else) e de [respostas bufferizadas em SSE](https://www.digitalocean.com/community/questions/does-app-platform-support-sse-server-sent-events-application), além de um [pedido de recurso](https://ideas.digitalocean.com/app-platform/p/http-response-streaming-in-app-platform-for-sse-support) para streaming. A documentação oficial de [limites](https://docs.digitalocean.com/products/app-platform/details/limits) não limita conexões simultâneas, mas não trata da duração. Limite de duração é tolerável (a conexão se renova e retoma pelo `Last-Event-ID`); buffering não é, pois anula o alerta imediato (ADR-002) e deixaria só a contingência de reconsulta a cada 10 s.
4. **O processo precisa ficar vivo.** A aplicação tem tarefas periódicas dentro do processo (expiração de pedidos a cada 10 s e expurgo, `src/instrumentation.ts`). Plataformas que reduzem a zero ou limitam a CPU entre requisições exigem configuração específica (instância mínima, CPU sempre alocada) ou um agendador externo. A confirmar por provedor.

### Comparação (candidatos)

| Critério | DigitalOcean (App Platform + Managed MySQL + Spaces) | Google Cloud (Cloud Run + Cloud SQL MySQL + Cloud Storage) | Magalu Cloud (Kubernetes + DBaaS MySQL + Object Storage) |
|---|---|---|---|
| Região no Brasil | **Não** (sem São Paulo nos documentos oficiais) | Cloud Run em `southamerica-east1` (São Paulo): [sim](https://docs.cloud.google.com/run/docs/locations). Cloud SQL e Cloud Storage em São Paulo: **não confirmado nesta pesquisa** | **Sim**: `br-se1` (São Paulo) e `br-ne1` (Fortaleza), [DBaaS](https://docs.magalu.cloud/docs/dbaas/prices) e [Object Storage](https://docs.magalu.cloud/docs/storage/object-storage/additional-explanations/regions/) |
| Modelo de execução | PaaS de contêiner (Dockerfile) | Contêiner gerenciado sem servidor | Kubernetes e registro de contêiner; PaaS de contêiner **não confirmado** (mais operação) |
| MySQL gerenciado | Sim; entrada em torno de US$ 15/mês (fonte secundária) | Sim (Cloud SQL) | Sim, disponível em produção desde jan/2026 ([notícia](https://tiinside.com.br/en/13/01/2026/magalu-cloud-lanca-produtos-de-infraestrutura-em-nuvem/)); em `br-se1`, 1 vCPU, 4 GB e 10 GB, instância única: cerca de R$ 94/mês; alta disponibilidade exige no mínimo 3 nós |
| Backup do banco | Diário, sem custo adicional (fontes do provedor e secundárias); recuperação até um ponto no tempo citada, **não confirmada** | Automático, retenção de 1 a 365 dias (padrão 7); [registros para recuperação até um ponto no tempo sem custo por até 7 dias](https://cloud.google.com/sql/pricing) na edição Enterprise | **Não confirmado** |
| Armazenamento S3 | Spaces: US$ 5/mês com 250 GiB e 1 TiB de saída, segundo a [página do produto](https://www.digitalocean.com/products/spaces) | Cloud Storage (API própria; interoperabilidade S3 a confirmar) | Compatível com S3; cerca de R$ 0,10 por GiB/mês, mais a saída |
| SSE e conexão longa | **Não confirmado**; relatos de limite de ~100 s e de buffering | Tempo limite configurável até [60 minutos](https://cloud.google.com/run/docs/configuring/request-timeout?hl=pt-BR); a conexão precisa reconectar | **Não pesquisado** |
| Processo persistente (agendador) | Contêiner contínuo | **Exige instância mínima com CPU sempre alocada** (a confirmar) ou agendador externo | Contêiner contínuo no cluster |
| Preço levantado | Parcial: contêineres de US$ 5 a US$ 25/mês (fonte secundária, possivelmente desatualizada) | **Não levantado** para São Paulo | Parcial: banco e armazenamento; computação **não levantada** |
| Operação | Baixa | Média (IAM, rede, faturamento) | Alta (Kubernetes) |

**Leitura.** Nenhum candidato está comprovado para este caso. A DigitalOcean é a que menos exige operação, mas tem região fora do Brasil e o risco de SSE aberto. O Google Cloud tem Cloud Run em São Paulo e SSE documentado, mas custo e operação maiores e o ponto do processo persistente. A Magalu Cloud atende à região e cobra em reais, mas com mais operação e vários dados por confirmar.

### Plano de prova de conceito (DEC-052)

Cada candidato escolhido sobe a aplicação em um ambiente **descartável, por poucos dias, só com dados fictícios** (nenhum dado pessoal real fora do país ou do ambiente de teste). A conta e a autorização de gasto são do responsável pelo projeto. Critérios, todos medidos e registrados aqui:

1. **SSE:** conexão aberta por pelo menos 10 minutos, com cortes seguidos de retomada sem perda ou duplicação; primeiro byte imediato (sem buffering); atraso entre o evento e a tela abaixo de 2 s.
2. **Agendador:** pedido sem resposta expira em até 15 s sem nenhuma requisição em andamento.
3. **Backup e restauração:** restaurar um backup do próprio provedor em banco temporário e rodar a verificação de `docs/operations/backup-e-restauracao.md`.
4. **Fotos:** gravar e ler objetos pelo armazenamento S3 do provedor (o driver S3 da aplicação ainda não existe; na prova, testar o armazenamento com ferramenta padrão).
5. **Latência:** tempo até o primeiro byte, medido de um celular em Cametá, em pelo menos 3 horários.
6. **Logs:** coletar o JSON da saída padrão e localizar uma requisição por `requisicaoId` (ADR-004).
7. **Custo:** custo da prova e estimativa mensal para homologação e produção.

O resultado dá a base para aprovar, ajustar ou trocar o provedor. Sem os critérios 1 a 3 atendidos, o candidato não é aprovado.

## Pontos a confirmar antes de aceitar

- **Região e LGPD:** se o provedor escolhido ficar fora do Brasil, a política de privacidade precisa tratar a transferência internacional de dados, o que depende da revisão jurídica (DEC-047). Estado: aberto, depende da escolha.
- **Preços atuais** de banco gerenciado, contêiner e armazenamento nas páginas oficiais. Estado: aberto; levantamento parcial acima.
- **Limites de duração e buffering do SSE** em cada candidato. Estado: aberto, coberto pela prova de conceito.
- **Suporte a processo persistente** em cada candidato. Estado: aberto, coberto pela prova de conceito.
- **Orçamento:** o responsável não definiu teto. Estado: aberto.

## Consequências

- Com a aprovação, o item 1.1 do backlog pode começar, e o Dockerfile e a configuração de ambiente fazem parte dele.
- O custo mensal será estimado após a prova de conceito e registrado aqui; o piloto deve caber em um cluster pequeno por ambiente.
- A aplicação já isola o armazenamento de fotos atrás de uma interface (`src/server/armazenamento.ts`); o driver S3 compatível será escrito depois da escolha do provedor.
- Um único provedor concentra aplicação, banco e arquivos; mitigado pela portabilidade do item 6.
- A região do provedor e a transferência internacional de dados passam a ser pendência do gate de privacidade (PRD §17).
