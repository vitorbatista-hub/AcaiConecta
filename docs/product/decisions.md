# Registro de decisões do AçaíConecta

**Última atualização:** Setembro de 2026

Este documento registra decisões de produto e negócio. Decisões arquiteturais detalhadas deverão ser registradas futuramente como ADRs em `docs/architecture/ADRs/`.

## Estados

- **Decidida:** aprovada para o escopo atual.
- **Provisória:** adotada para permitir avanço, mas deve ser validada.
- **Pendente:** depende de pesquisa, teste ou escolha do responsável.
- **Substituída:** deixou de valer; a decisão sucessora deve ser indicada.

## Decisões tomadas

| ID | Data | Estado | Decisão | Justificativa |
|---|---|---|---|---|
| DEC-001 | 2026-09-01 | Decidida | Cametá/PA será o mercado inicial. | Reduzir o escopo e validar em um contexto conhecido. |
| DEC-002 | 2026-09-01 | Decidida | A plataforma não terá frota própria no MVP. | Produção e entrega continuarão sob responsabilidade das batedeiras. |
| DEC-003 | 2026-09-01 | Substituída pela DEC-024 | O MVP usaria pagamento na entrega: dinheiro ou Pix presencial. | A decisão foi revista para incorporar Pix on-line ao MVP. |
| DEC-004 | 2026-09-01 | Substituída pela DEC-024 | Pix in-app, cartão e split ficariam fora do MVP. | O Pix on-line passou a fazer parte do MVP; cartão continua fora. |
| DEC-005 | 2026-09-01 | Decidida | O piloto será controlado e terá inicialmente de 3 a 5 batedeiras. | Permitir acompanhamento próximo e aprendizado com baixo risco. |
| DEC-006 | 2026-09-01 | Substituída pela DEC-023 | A primeira interface seria uma aplicação web responsiva. | A stack e a entrega web instalável foram consolidadas posteriormente. |
| DEC-007 | 2026-09-01 | Decidida | O projeto será organizado em seis fases com critérios de conclusão. | Evitar crescimento prematuro e separar construção de validação. |
| DEC-008 | 2026-09-01 | Decidida | Markdown será a fonte oficial da documentação versionada. | Facilitar revisão, histórico e comparação no Git. |
| DEC-009 | 2026-09-02 | Decidida | A Fase 1 foi concluída e o projeto avançará para a Fase 2. | Três batedeiras aceitaram o piloto e nove consumidores confirmaram preliminarmente o interesse na proposta. |
| DEC-010 | 2026-09-02 | Decidida | A fila será ordenada pelo horário de criação do pedido. | A operação atual já utiliza ordem de chegada e a regra é compreensível para os participantes. |
| DEC-011 | 2026-09-02 | Substituída pela DEC-031 | O prazo inicial para aceitar ou recusar um pedido seria de cinco minutos. | O prazo foi fixado para todo o piloto. |
| DEC-012 | 2026-09-02 | Substituída pela DEC-031 | O MVP usaria campos estruturados, mensagens operacionais e contingência de suporte, sem chat livre. | O formato foi confirmado para o MVP reduzido. |
| DEC-013 | 2026-09-02 | Decidida | Fotos de produtos farão parte do MVP; vídeos ficarão para uma fase posterior. | Fotos atendem à necessidade de divulgação com menor complexidade de armazenamento, desempenho e moderação. |
| DEC-014 | 2026-09-03 | Decidida | O MVP atenderá exclusivamente pedidos para entrega, sem retirada no local. | Manter o fluxo operacional único durante o piloto. |
| DEC-015 | 2026-09-03 | Substituída pela DEC-037 | Cliente e batedeira poderiam cancelar o pedido até antes de `SAIU_PARA_ENTREGA`. | A política foi restringida para evitar cancelamento direto do cliente após o início da operação. |
| DEC-016 | 2026-09-03 | Substituída pela DEC-032 | A batedeira concluiria a entrega após confirmação do entregador; o cliente poderia contestá-la. | O fluxo formal de contestação foi retirado do MVP reduzido. |
| DEC-017 | 2026-09-03 | Substituída pela DEC-032 | O entregador registraria uma fotografia em frente ao endereço como evidência da entrega. | A evidência fotográfica foi retirada para reduzir complexidade operacional e tratamento de dados pessoais. |
| DEC-018 | 2026-09-03 | Substituída pela DEC-033 | A batedeira poderia realizar o próprio cadastro, sujeito à análise documental antes da ativação. | No piloto, o administrador fará o cadastro assistido das participantes previamente selecionadas. |
| DEC-019 | 2026-09-03 | Decidida | O piloto começará no bairro Centro, em Cametá. | Limitar a cobertura para acompanhar a operação inicial. |
| DEC-020 | 2026-09-03 | Decidida | Cada pedido deverá totalizar no mínimo 1 litro de açaí. | Aplicar a condição operacional definida para o piloto. |
| DEC-021 | 2026-09-03 | Substituída pela DEC-034 | O modelo de receita após o piloto seria uma mensalidade paga pela batedeira. | A monetização foi retirada do MVP e preservada apenas como hipótese pós-piloto. |
| DEC-022 | 2026-09-03 | Substituída pela DEC-033 | CNPJ seria opcional, mas CPF do responsável, alvará de funcionamento e licença sanitária válidos seriam obrigatórios para ativação. | A plataforma não coletará documentos no MVP; a elegibilidade será verificada fora do sistema antes do cadastro assistido. |
| DEC-023 | 2026-09-03 | Decidida | O MVP usará TypeScript, Next.js, React, Tailwind CSS, MySQL e Prisma em um monólito modular, entregue como aplicação web responsiva e instalável. | Reduzir complexidade operacional, manter uma única base de código e preservar capacidade de evolução. |
| DEC-024 | 2026-09-03 | Substituída pela DEC-030 | O MVP aceitaria dinheiro na entrega ou Pix on-line gerado pelo site. | O processamento financeiro foi retirado do MVP reduzido. |
| DEC-025 | 2026-09-03 | Substituída pela DEC-030 | O Pix on-line teria expiração e uma renovação. | Não haverá cobrança Pix gerada pela plataforma no MVP. |
| DEC-026 | 2026-09-03 | Substituída pela DEC-030 | O provedor creditaria a venda diretamente na conta conectada da batedeira. | A plataforma não integrará um provedor de pagamento no MVP. |
| DEC-027 | 2026-09-03 | Substituída pela DEC-030 | A tarifa de processamento seria responsabilidade da batedeira. | Pagamentos ocorrerão diretamente na entrega e fora da conciliação da plataforma. |
| DEC-028 | 2026-09-03 | Substituída pela DEC-030 | Cancelamentos e falhas elegíveis gerariam devolução pela transação original. | A plataforma não processará pagamentos nem devoluções no MVP. |
| DEC-029 | 2026-09-03 | Substituída pela DEC-032 | O cliente poderia abrir contestação formal em até uma hora. | Ocorrências serão atendidas pelo suporte do piloto, sem módulo de contestação. |
| DEC-030 | 2026-09-03 | Decidida | No MVP reduzido, o pagamento ocorrerá na entrega, em dinheiro ou Pix transferido diretamente à batedeira; a plataforma não gerará, confirmará, conciliará ou devolverá pagamentos. | Remover a principal dependência externa e concentrar a validação em descoberta e organização de pedidos. |
| DEC-031 | 2026-09-03 | Decidida | O prazo de aceite será de cinco minutos durante todo o piloto; mensagens predefinidas e suporte humano serão a comunicação de contingência. | Tornar as métricas comparáveis e testar a solução mais simples compatível com a evidência da Fase 1. |
| DEC-032 | 2026-09-03 | Decidida | O MVP não terá fotografia de entrega nem contestação formal; falhas e reclamações serão registradas pelo suporte como incidentes do piloto. | Reduzir coleta de dados, complexidade operacional e funcionalidades não validadas. |
| DEC-033 | 2026-09-03 | Decidida | As batedeiras do piloto serão cadastradas de forma assistida pelo administrador, com um único operador responsável; não haverá autoatendimento documental no sistema. | O grupo é pequeno e previamente selecionado, tornando desnecessário construir onboarding e gestão multiusuário. |
| DEC-034 | 2026-09-03 | Decidida | O piloto será gratuito, sem comissão ou mensalidade; o modelo de receita será pesquisado somente após a validação operacional. | Evitar que uma hipótese comercial não validada aumente o escopo ou contamine o experimento inicial. |
| DEC-035 | 2026-09-03 | Decidida | O MVP usará apenas alertas e atualização de estado dentro da aplicação; Web Push, SMS e e-mails transacionais ficarão fora do escopo. | Evitar integrações de comunicação antes de validar o uso contínuo do painel. |
| DEC-036 | 2026-09-03 | Decidida | Cada batedeira configurará uma taxa de entrega em centavos para o bairro Centro, inclusive zero; o valor será exibido antes do envio e preservado no pedido. | Garantir transparência e um total determinístico sem cálculo por distância. |
| DEC-037 | 2026-09-03 | Decidida | O cliente poderá cancelar diretamente somente antes do aceite; depois disso, apenas a batedeira ou o administrador poderá cancelar por impossibilidade operacional antes da saída para entrega, sempre com motivo. | Proteger a operação contra desistência após o início do preparo sem impedir o tratamento auditável de exceções. |

## Gates externos ainda abertos

Não há decisão interna de produto pendente para prototipar o MVP reduzido. A validação jurídica da operação local e as escolhas de infraestrutura permanecem gates externos das fases 2 e 3, respectivamente, e não autorizam suposições durante a implementação.

## Modelo para novas decisões

Ao registrar uma decisão, informe:

- identificador;
- data;
- estado;
- contexto;
- alternativas consideradas;
- decisão;
- justificativa;
- consequências;
- responsável, quando aplicável.
