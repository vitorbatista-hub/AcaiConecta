# ADR-003 — Infraestrutura de hospedagem, banco, arquivos e observabilidade

**Estado:** Proposta (aguarda aprovação do responsável pelo projeto)
**Data:** 2026-11-23
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

## Pontos a confirmar antes de aceitar

- **Região:** a pesquisa não encontrou datacenter no Brasil para esses serviços. Hospedar fora do país adiciona latência e exige que a política de privacidade trate a transferência internacional de dados (LGPD), ponto que já depende de revisão jurídica (DEC-047). Se a latência ou a conformidade for problema, reavaliar o provedor.
- Disponibilidade e preço atuais do Managed MySQL, do App Platform com conexões longas e do Spaces, conferidos nas páginas oficiais do provedor.
- Limite de duração de conexão do balanceador do App Platform, para dimensionar a reconexão do SSE (ADR-002 já prevê retomada por `Last-Event-ID`).

## Consequências

- Com a aprovação, o item 1.1 do backlog pode começar, e o Dockerfile e a configuração de ambiente fazem parte dele.
- O custo mensal será estimado após a escolha dos planos e registrado aqui; o piloto deve caber em um cluster pequeno por ambiente.
- Um único provedor concentra aplicação, banco e arquivos; mitigado pela portabilidade do item 6.
- A região do provedor e a transferência internacional de dados passam a ser pendência do gate de privacidade (PRD §17).
