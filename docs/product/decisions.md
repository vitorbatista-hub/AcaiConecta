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
| DEC-003 | 2026-09-01 | Decidida | O MVP usará pagamento na entrega: dinheiro ou Pix presencial. | Evitar complexidade financeira antes da validação operacional. |
| DEC-004 | 2026-09-01 | Decidida | Pix in-app, cartão e split ficarão fora do MVP. | Dependem de modelo financeiro, conciliação e avaliação jurídica. |
| DEC-005 | 2026-09-01 | Decidida | O piloto será controlado e terá inicialmente de 3 a 5 batedeiras. | Permitir acompanhamento próximo e aprendizado com baixo risco. |
| DEC-006 | 2026-09-01 | Provisória | A primeira interface será uma aplicação web responsiva. | Reduzir custo e permitir acesso sem depender de lojas de aplicativos. |
| DEC-007 | 2026-09-01 | Decidida | O projeto será organizado em seis fases com critérios de conclusão. | Evitar crescimento prematuro e separar construção de validação. |
| DEC-008 | 2026-09-01 | Decidida | Markdown será a fonte oficial da documentação versionada. | Facilitar revisão, histórico e comparação no Git. |
| DEC-009 | 2026-09-02 | Decidida | A Fase 1 foi concluída e o projeto avançará para a Fase 2. | Três batedeiras aceitaram o piloto e nove consumidores confirmaram preliminarmente o interesse na proposta. |
| DEC-010 | 2026-09-02 | Decidida | A fila será ordenada pelo horário de criação do pedido. | A operação atual já utiliza ordem de chegada e a regra é compreensível para os participantes. |
| DEC-011 | 2026-09-02 | Provisória | O prazo inicial para aceitar ou recusar um pedido será de cinco minutos. | As batedeiras consultadas consideraram o prazo viável; o piloto medirá o comportamento real. |
| DEC-012 | 2026-09-02 | Provisória | O MVP usará campos estruturados, mensagens operacionais e contingência de suporte, sem chat livre. | Estados foram aceitos, mas endereço, troco, reclamações e exceções ainda exigem comunicação. |
| DEC-013 | 2026-09-02 | Decidida | Fotos de produtos farão parte do MVP; vídeos ficarão para uma fase posterior. | Fotos atendem à necessidade de divulgação com menor complexidade de armazenamento, desempenho e moderação. |
| DEC-014 | 2026-09-03 | Decidida | O MVP atenderá exclusivamente pedidos para entrega, sem retirada no local. | Manter o fluxo operacional único durante o piloto. |
| DEC-015 | 2026-09-03 | Decidida | Cliente e batedeira poderão cancelar o pedido até antes de `SAIU_PARA_ENTREGA`, sempre com motivo registrado após o aceite. | Permitir o tratamento de desistência, atraso ou indisponibilidade sem aceitar cancelamento durante o deslocamento. |
| DEC-016 | 2026-09-03 | Decidida | A batedeira concluirá a entrega após confirmação do entregador; o cliente poderá contestá-la. | Definir responsáveis pelo encerramento e pela contestação do pedido. |
| DEC-017 | 2026-09-03 | Decidida | O entregador registrará uma fotografia em frente ao endereço como evidência da entrega. | Apoiar a análise manual de divergências junto ao histórico do pedido, reconhecendo que a foto não comprova isoladamente o recebimento. |
| DEC-018 | 2026-09-03 | Decidida | A batedeira poderá realizar o próprio cadastro, sujeito à análise documental antes da ativação. | Facilitar a adesão sem eliminar o controle administrativo. |
| DEC-019 | 2026-09-03 | Decidida | O piloto começará no bairro Centro, em Cametá. | Limitar a cobertura para acompanhar a operação inicial. |
| DEC-020 | 2026-09-03 | Decidida | Cada pedido deverá totalizar no mínimo 1 litro de açaí. | Aplicar a condição operacional definida para o piloto. |
| DEC-021 | 2026-09-03 | Provisória | O modelo de receita após o piloto será uma mensalidade paga pela batedeira. | Evitar conciliação por pedido; preço, período gratuito e condições comerciais ainda serão validados. |
| DEC-022 | 2026-09-03 | Decidida | CNPJ será opcional, mas CPF do responsável, alvará de funcionamento e licença sanitária válidos serão obrigatórios para ativação. | Permitir participação sem CNPJ sem flexibilizar os requisitos sanitários e operacionais adotados pela plataforma. |
| DEC-023 | 2026-09-03 | Decidida | O MVP usará TypeScript, Next.js, React, Tailwind CSS, MySQL e Prisma em um monólito modular, entregue como aplicação web responsiva e instalável. | Reduzir complexidade operacional, manter uma única base de código e preservar capacidade de evolução. |

## Decisões pendentes

| ID | Prioridade | Decisão necessária | Evidência ou responsável esperado |
|---|---|---|---|
| PEN-013 | Alta | Qual será o procedimento administrativo e o prazo para resolver uma entrega contestada? | Definir responsáveis, evidências adicionais e resultado possível antes do piloto. |
| PEN-014 | Alta | Por quanto tempo fotografias de entrega e documentos serão armazenados? | Definir política de privacidade, retenção e acesso antes do piloto. |
| PEN-015 | Média | Qual será o valor da mensalidade e haverá gratuidade durante o piloto? | Validar disposição para pagar e estimar custos operacionais. |
| PEN-016 | Média | Quais exigências complementares ou dispensas se aplicam localmente ao cadastro sem CNPJ? | Confirmar o procedimento com os órgãos competentes de Cametá. |
| PEN-017 | Média | Quais provedores serão usados para hospedagem, banco, autenticação, arquivos e observabilidade? | Comparar custo, suporte e requisitos técnicos antes da implementação. |

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
