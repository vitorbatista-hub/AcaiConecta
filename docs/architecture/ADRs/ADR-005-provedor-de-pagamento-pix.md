# ADR-005 — Provedor de pagamento Pix

**Estado:** Proposta em elaboração (25/11/2026). **Não aprovada**: a comparação abaixo tem lacunas que só a documentação completa, a conta de teste (sandbox) e uma cotação do provedor fecham. O provedor **não** está escolhido.
**Data:** 2026-11-25
**Responsável pela decisão:** responsável pelo projeto, a partir de recomendação técnica
**Relacionados:** PRD 2.7 §14; DEC-056, DEC-058, DEC-059, DEC-060; backlog 9.1 a 9.8; [ADR-003](ADR-003-infraestrutura.md); [arquitetura técnica](../../product/arquitetura-tecnica.md) §2

## Contexto

O PRD 2.7 (DEC-056, DEC-058) exige um provedor de pagamento Pix que permita:

1. **Conta conectada:** o valor é creditado direto na conta da batedeira; a plataforma não guarda chave Pix, dados bancários nem documentos de pagamento, só o identificador da conta e o status (`NAO_CADASTRADA`, `PENDENTE`, `VERIFICADA`, `RECUSADA`).
2. **Cadastro assistido:** o administrador inicia o cadastro e a **própria batedeira o conclui no formulário do provedor** (KYC feito pelo provedor). Sem conta `VERIFICADA`, a batedeira só recebe dinheiro na entrega.
3. **Pix com prazo de 10 minutos** para pagar, expirando sem custo (DEC-056, DEC-059).
4. **Estorno em até 24 h**, total (e, se possível, parcial), feito pela batedeira **ou** pelo administrador. Se o provedor só permitir um dos lados, o estorno fica com a batedeira (DEC-058, item 5); permitir os dois é desejável.
5. **Webhook** idempotente, autenticado e auditável (AGENTS.md), pois a tabela `eventos_webhook` do schema já deduplica por evento.
6. **Tarifa:** a plataforma paga a tarifa do provedor durante o piloto (DEC-056, DEC-060), e o custo precisa ser estimado nesta ADR. Depois do piloto é decisão em aberto (DEC-056, questão 3).
7. **Contestação** (DEC-058): é decidida pelo administrador na plataforma; o provedor só executa o estorno.

## Método e limites da pesquisa

Páginas oficiais dos provedores foram lidas em 25/11/2026 por agentes de leitura. Onde um agente marcou o trecho como "resumo", o texto não é literal e deve ser conferido na página. **NÃO CONFIRMADO** significa que a informação não estava nas páginas lidas, não que o recurso não exista. Nenhum preço abaixo é cotação. Candidatos lidos: Asaas, Stripe, Pagar.me e Mercado Pago. Efí, Iugu e outros não foram avaliados.

## Comparação

| Critério | Asaas | Stripe (Brasil) | Pagar.me | Mercado Pago |
|---|---|---|---|---|
| Cadastro da conta da batedeira pelo provedor | `POST /v3/accounts` cria a subconta. Modelo BaaS tem `onboardingUrl` com documentos e prova de vida; o formato BaaS "precisa estar previamente alinhado" com o gerente de contas. Modelo não-BaaS: o titular recebe e-mail de ativação e envia os documentos no Asaas | Onboarding em formulário hospedado pela Stripe, com a marca da plataforma, feito pelo usuário da conta | Recebedor criado por API com os dados cadastrais; rota gera link/QR Code de prova de vida (`kyc_link`). Quem acessa o link: NÃO CONFIRMADO | OAuth: a vendedora autoriza a plataforma; KYC e conta própria: NÃO CONFIRMADO |
| Status da conta | Quatro campos (`commercialInfo`, `bankAccountInfo`, `documentation`, `general`); aprovada quando `general` = `APPROVED`; análise em até 48 h. Valores completos: NÃO CONFIRMADO | `requirements`, `charges_enabled` e afins: NÃO CONFIRMADO nas páginas lidas | Exemplo `active`; KYC `partially_denied` citado; lista: NÃO CONFIRMADO | NÃO CONFIRMADO |
| Prazo do Pix | Expiração configurável e prazo de 10 min: NÃO CONFIRMADO (QR "possui vencimento") | NÃO CONFIRMADO | `expires_in` em segundos, por cobrança: **atende** | Configurável entre **30 min** e 30 dias, padrão 24 h (resumo): **não atende diretamente 10 min**; exigiria cancelar o Pix pendente pela API aos 10 min |
| Estorno de Pix | Total ou várias parciais; `splitRefunds`; 400 se não houver saldo; prazo máximo: NÃO CONFIRMADO; quem estorna: NÃO CONFIRMADO | Até 90 dias, total ou parcial, em poucos minutos; irreversível. Em cobranças de destino ou separadas, o débito é do saldo da **plataforma**, que pode reverter a transferência à conta conectada; em cobranças diretas, debita a conta conectada | Total ou parcial, até 90 dias após a conciliação; quem pede e de onde sai o dinheiro com split: NÃO CONFIRMADO | Até 180 dias, parcial permitido, exige saldo; Pix específico e quem pode: NÃO CONFIRMADO |
| Webhook | Token no cabeçalho `asaas-access-token` (sem assinatura HMAC confirmada); entrega "pelo menos uma vez"; campo `id` do evento serve à deduplicação; eventos guardados 14 dias; fila pode pausar após 15 falhas | Assinatura e idempotência: NÃO CONFIRMADO (páginas de webhooks não lidas) | Eventos como `order.paid`, `charge.refunded`, `recipient.updated`; assinatura e reenvio: NÃO CONFIRMADO | Cabeçalho `x-signature` (`ts` e `v1`, HMAC); reenvio a cada 15 min; idempotência: NÃO CONFIRMADO |
| Tarifa por Pix recebido | Página de preços: "R$ 1,99 / R$ 0,99 por transação" (sem indicar o plano); subcontas e marketplace: NÃO CONFIRMADO | **1,19% por Pix pago**; sem mensalidade no plano Padrão; Connect: 0,25% para plataformas que aplicam preço próprio (página de Connect não lida); custo por conta conectada: NÃO CONFIRMADO | NÃO CONFIRMADO (página de tarifas não localizada); Pix com split só para clientes com afiliação Pagar.me | NÃO CONFIRMADO (página de tarifas devolveu 403) |
| Condição comercial | Período de avaliação em produção: até 10 subcontas e R$ 2.000 por subconta em 60 dias | Pix com Connect exige que a conta conectada esteja em país compatível (Brasil está); a plataforma ser brasileira: NÃO CONFIRMADO | Afiliação exigida | NÃO CONFIRMADO |

### Estimativa de custo no piloto (a conferir com cotação)

Para um pedido de R$ 25 pago por Pix (cerca de um litro com taxa de entrega; valor ilustrativo, não é dado do projeto):

- **Stripe:** 1,19% ≈ R$ 0,30, mais a tarifa de Connect (0,25% ≈ R$ 0,06) se aplicável, ≈ R$ 0,36 (sujeito às tarifas de conta conectada, não confirmadas).
- **Asaas:** R$ 0,99 a R$ 1,99 por Pix, ou 4% a 8% do pedido, conforme o plano; o plano para plataforma com subcontas é NÃO CONFIRMADO.

A tarifa é paga pela plataforma durante o piloto (DEC-060), então o custo mensal é função do número de Pix, que ainda não é conhecido.

## Leitura (não é decisão)

- **Nenhum candidato está comprovado.** Todos têm itens críticos NÃO CONFIRMADOS: quem pode estornar e de onde sai o dinheiro (4 de 4), assinatura do webhook (3 de 4) e tarifa de conta conectada (4 de 4).
- **Mercado Pago** tem o único requisito claramente desfavorável (prazo mínimo de 30 minutos), contornável pela aplicação, e a documentação de marketplace e de tarifas não pôde ser lida.
- **Stripe e Asaas** são os mais completos nos dados lidos: ambos têm cadastro hospedado da conta da batedeira e estorno parcial; a Stripe tem a regra de débito do estorno documentada e uma tarifa percentual publicada, o Asaas tem deduplicação de webhook por `id` e um modelo de subconta, mas exige alinhamento comercial para o formato BaaS.
- **Inferência (a validar):** como a plataforma é quem chama a API, "estorno pela batedeira ou pelo administrador" pode ser uma regra de autorização **da aplicação**, executada com a credencial da plataforma, desde que o provedor deixe a plataforma estornar um valor creditado na conta conectada. Isso atende a DEC-058 sem exigir que a batedeira use o painel do provedor. Falta confirmar, por provedor, de onde o valor sai e se a batedeira precisa autorizar.

## Decisão proposta

Ainda não há escolha. Propõe-se **avaliar Stripe e Asaas em sandbox, com dados fictícios**, antes de aprovar, e só então escolher. Mercado Pago e Pagar.me ficam como alternativas, a reavaliar se os dois principais falharem em algum critério. Critérios da prova, todos medidos e registrados aqui:

1. **Cadastro:** criar uma conta de teste, enviar o link ao titular, concluí-lo e receber o status final por webhook ou consulta, mapeando para `NAO_CADASTRADA`, `PENDENTE`, `VERIFICADA` e `RECUSADA`.
2. **Prazo:** Pix com expiração em 10 minutos; pago aos 9 e aos 11 minutos, para tratar a corrida entre expiração e pagamento tardio (o pedido já `CANCELADO` e o Pix pago depois exigem estorno automático).
3. **Estorno:** total e parcial, iniciado pela credencial da plataforma, em conta conectada com e sem saldo; de onde o valor sai; tempo até o cliente receber.
4. **Webhook:** verificar assinatura ou token, reenvio duplicado e fora de ordem, e resposta lenta; confirmar que o identificador do evento é estável para `eventos_webhook`.
5. **Tarifa:** cotação por escrito (Pix recebido, conta conectada, estorno) e cálculo para 3 a 5 batedeiras.
6. **Contestação do pagador (MED, no Stripe):** como o provedor trata uma devolução solicitada pelo banco do cliente e como isso se relaciona com a contestação interna (DEC-058).

Sem os critérios 1 a 4 atendidos, o candidato não é aprovado.

## Consequências esperadas da escolha

- O backlog 9.1 só pode ser fechado com esta ADR aprovada; os itens 9.2 a 9.6 dependem dela.
- A aprovação exige a conta e a autorização de gasto do responsável pelo projeto, e a política de privacidade passa a tratar o provedor como operador de dados (backlog 9.8, PRD §17).
- O schema 0.9 já guarda `conta_pagamento_id`, `conta_pagamento_status`, `pagamentos`, `estornos`, `contestacoes` e `eventos_webhook`; nomes de colunas externas podem mudar depois da escolha.
- O endpoint público de webhook precisa de TLS e estabilidade, o que se liga à ADR-003 (hospedagem).

## Pendências

- Ler as páginas não lidas: split e subconta do Asaas, webhooks do Stripe, tarifas de Connect do Stripe, split do Pagar.me, marketplace e tarifas do Mercado Pago.
- Confirmar, por escrito com cada provedor, as tarifas de conta conectada e o prazo máximo do estorno do Asaas.
- Conferir se cada provedor aceita conta conectada de pessoa física (batedeira com CPF, DEC-055), não só de empresa com CNPJ; este ponto **não foi pesquisado** e pode eliminar candidatos.
