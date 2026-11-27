# Fluxos operacionais do MVP

**Status:** Fluxos vigentes do MVP (PRD 2.7); a aplicação em `app/` implementa parte deles, sem banco
**Escopo:** Piloto na zona urbana de Cametá/PA (DEC-057), com pagamento em dinheiro ou Pix on-line (DEC-056, DEC-058, DEC-059)

Este documento transforma as regras do [PRD vigente](PRD.md) e do [registro de decisões](decisions.md) em sequências operacionais. Ele não substitui essas fontes: divergências deverão ser resolvidas nelas antes da implementação.

## Princípios comuns

- O MVP atende somente pedidos para entrega.
- A batedeira precisa estar `ATIVA`, aberta e com entrega disponível para receber pedidos.
- Cada pedido deve totalizar pelo menos 1.000 ml.
- A forma de pagamento é escolhida pelo cliente **depois do aceite**: dinheiro na entrega ou Pix on-line, confirmado pelo provedor de pagamento.
- O Pix é creditado direto na conta conectada da batedeira; a plataforma não custodia valores nem guarda dados bancários.
- Webhooks do provedor são idempotentes e auditáveis; estornos e contestações ficam registrados com autor e prazo.
- Cada comando de criação de pedido usa chave de idempotência.
- Toda mudança de estado registra autor ou processo automático, momento e contexto aplicável.
- Mensagens são predefinidas; situações não cobertas seguem para o suporte humano.

## Fluxo do cliente

### Descoberta e criação do pedido

1. O cliente acessa a listagem de batedeiras aprovadas.
2. O sistema apresenta estado de abertura, disponibilidade de entrega, bairro atendido e faixa estimada.
3. O cliente pode buscar pelo nome e filtrar pelo bairro.
4. O cliente abre o perfil de uma batedeira e consulta catálogo, preços, volumes, taxa de entrega e estimativa.
5. Para enviar o pedido, o cliente cria uma conta ou entra em uma conta ativa.
6. O cliente seleciona produtos e quantidades.
7. O sistema calcula o volume e impede o envio abaixo de 1.000 ml.
8. O cliente escolhe ou cadastra um endereço em um bairro urbano da lista oficial; a plataforma mostra primeiro as batedeiras que atendem o bairro do endereço principal (filtro editável).
9. O sistema exibe subtotal, taxa de entrega, total e faixa estimada antes da confirmação.
10. O cliente pode acrescentar observações limitadas aos itens ou ao pedido. A forma de pagamento **não** é escolhida neste momento.
11. Ao confirmar, o sistema revalida disponibilidade, catálogo, preços, cobertura e total.
12. O sistema cria o pedido em `AGUARDANDO_ACEITE`, preserva os snapshots e inicia o prazo de cinco minutos.
13. O cliente acompanha a linha do tempo dentro da aplicação.

### Resposta e acompanhamento

- Se a batedeira aceitar dentro do prazo, o pedido muda para `ACEITO` e o cliente passa a ter 10 minutos para escolher a forma de pagamento.
- Se recusar, o pedido muda para `RECUSADO` e apresenta o motivo.
- Se não responder em cinco minutos, o sistema muda o pedido para `EXPIRADO`.
- Antes do aceite, o cliente pode cancelar diretamente, levando o pedido a `CANCELADO`.
- Depois do aceite, solicitações de cancelamento do cliente são encaminhadas ao suporte e não alteram automaticamente o estado.
- O cliente acompanha `EM_PREPARO`, `PRONTO`, `SAIU_PARA_ENTREGA` e o desfecho `ENTREGUE` ou `FALHA_NA_ENTREGA`.

### Pagamento (depois do aceite)

1. **Dinheiro:** o cliente informa, se quiser, o valor para troco; o pedido segue direto para `EM_PREPARO` e o valor é recolhido na entrega.
2. **Pix:** o pedido muda para `AGUARDANDO_PAGAMENTO`, o sistema gera a cobrança no provedor e o cliente tem 10 minutos para pagar.
3. Quando o provedor confirma o pagamento (webhook idempotente), o pedido segue para `EM_PREPARO`.
4. Sem escolha da forma de pagamento em 10 minutos, o pedido é encerrado sem custo (`CANCELADO`, motivo "forma de pagamento não escolhida") e a batedeira é avisada (DEC-059).
5. Se o Pix não for pago em 10 minutos, o pedido é encerrado sem custo (`CANCELADO`, motivo "pagamento expirado") e a batedeira é avisada; o cliente reinicia o processo com um novo pedido (DEC-058).
6. Enquanto a batedeira não estiver com a conta verificada no provedor, só o dinheiro é oferecido.

### Estorno e contestação

- Se a batedeira cancelar um pedido pago, o valor é estornado em até 24 h do cancelamento, pela batedeira ou pelo administrador.
- O cliente pode abrir uma **contestação** (motivos do PRD §14.3): no Pix, a partir da confirmação do pagamento; no dinheiro, a partir do aceite; e até 24 h depois da entrega ou da falha registrada.
- Na falha de entrega com Pix pago, o estorno ocorre em até 24 h da abertura da contestação.
- O administrador decide a contestação, com primeira resposta em até 1 hora no piloto.

## Fluxo da batedeira

### Preparação para operar

1. O operador responsável acessa o painel com uma conta ativa.
2. O sistema confirma que a batedeira está administrativamente `ATIVA`.
3. O operador mantém catálogo (produtos de 500 ml ou 1 L, DEC-042), preços e disponibilidade dos produtos atualizados e decide se cada produto temporariamente indisponível continua visível para consulta.
4. O operador configura horários, estado aberto ou fechado, disponibilidade de entrega e, na lista oficial de bairros urbanos, os bairros que atende, com taxa e faixa estimada por bairro; a ativação exige ao menos um bairro.
5. O operador conclui o cadastro no provedor de pagamento (conta conectada) para receber Pix; antes de verificada, só aceita dinheiro.
6. O operador mantém o painel aberto durante o horário do piloto para receber alertas visuais.

### Atendimento do pedido

1. Um novo pedido aparece destacado em `AGUARDANDO_ACEITE`, com contagem do prazo restante.
2. A fila é ordenada pelo horário de criação.
3. O operador analisa itens, endereço, observações e estimativa; a forma de pagamento ainda não foi escolhida.
4. Em até cinco minutos, aceita ou recusa o pedido.
5. A recusa exige um motivo previsto ou descrição quando a opção for “outro”.
6. Depois do aceite, aguarda a escolha do cliente: com dinheiro, o pedido vai direto para `EM_PREPARO`; com Pix, fica em `AGUARDANDO_PAGAMENTO` até a confirmação do provedor, e só então o operador começa o preparo.
7. Quando a produção termina, registra `PRONTO`.
8. Quando o responsável inicia a entrega, registra `SAIU_PARA_ENTREGA`.
9. Após confirmação do responsável pela entrega, registra `ENTREGUE`.
10. Se a entrega não puder ser concluída, registra `FALHA_NA_ENTREGA` com motivo.

### Exceções

- Um pedido expirado não pode ser aceito posteriormente.
- Entre `ACEITO` e antes de `SAIU_PARA_ENTREGA`, a batedeira pode cancelar somente por impossibilidade operacional e deve informar o motivo; se o pedido já estiver pago, o estorno em até 24 h é obrigatório.
- Após `SAIU_PARA_ENTREGA`, não há cancelamento comum; o desfecho é entrega ou falha na entrega.
- O pagamento em dinheiro é recolhido na entrega e conta no faturamento quando o pedido é `ENTREGUE`; o Pix conta na confirmação, e o estorno é descontado no dia em que ocorre.
- A batedeira pode realizar estornos que lhe cabem e acompanhar contestações abertas contra seus pedidos; a decisão é do administrador.
- Problemas fora das mensagens predefinidas são encaminhados ao suporte.

## Fluxo do administrador

### Cadastro e operação do piloto

1. O administrador seleciona as batedeiras do piloto.
2. A batedeira se cadastra pelo site (DEC-054), informando CPF ou CNPJ válido (DEC-055) e o operador responsável, e envia os documentos exigidos (DEC-065, ainda não implementado); a conta nasce em análise. O administrador confere o cadastro e os documentos e inicia o cadastro assistido dela no provedor de pagamento, concluído pela própria batedeira.
3. Mantém a lista oficial de bairros urbanos (13 bairros, sem habilitação individual) e revisa perfil, localização e cobertura da batedeira.
4. Ativa a batedeira quando os requisitos aplicáveis estiverem atendidos, incluindo ao menos um bairro atendido.
5. Registra em auditoria as ações de ativação, suspensão, reativação e alterações administrativas relevantes.

### Suporte e supervisão

1. O administrador consulta pedidos, linha do tempo e contexto operacional.
2. Registra intervenções administrativas relacionadas ao pedido.
3. Pode cancelar um pedido aceito, antes de `SAIU_PARA_ENTREGA`, somente por impossibilidade operacional e com motivo.
4. Decide as contestações abertas (primeira resposta em até 1 hora, com alerta no painel) e exerce a função de suporte.
5. Realiza ou acompanha estornos de pedidos pagos e verifica os que se aproximam do prazo de 24 h.
6. Acompanha métricas do piloto e preserva a definição vigente durante sua execução.
7. Suspende uma batedeira quando necessário; a suspensão bloqueia novos pedidos, mas não apaga o histórico.

## Matriz de transições do pedido

| Estado atual | Próximo estado | Responsável | Condição |
|---|---|---|---|
| `AGUARDANDO_ACEITE` | `ACEITO` | Batedeira | Dentro dos cinco minutos. |
| `AGUARDANDO_ACEITE` | `RECUSADO` | Batedeira | Motivo obrigatório. |
| `AGUARDANDO_ACEITE` | `EXPIRADO` | Sistema | Prazo encerrado sem resposta. |
| `AGUARDANDO_ACEITE` | `CANCELADO` | Cliente | Antes do aceite. |
| `ACEITO` | `EM_PREPARO` | Sistema | Cliente escolheu dinheiro dentro de 10 minutos. |
| `ACEITO` | `AGUARDANDO_PAGAMENTO` | Sistema | Cliente escolheu Pix dentro de 10 minutos. |
| `ACEITO` | `CANCELADO` | Sistema | Forma de pagamento não escolhida em 10 minutos (DEC-059). |
| `ACEITO` | `CANCELADO` | Batedeira ou administrador | Impossibilidade operacional com motivo. |
| `AGUARDANDO_PAGAMENTO` | `EM_PREPARO` | Sistema | Pagamento confirmado pelo provedor (webhook idempotente). |
| `AGUARDANDO_PAGAMENTO` | `CANCELADO` | Sistema | Pix não pago em 10 minutos (motivo "pagamento expirado"). |
| `AGUARDANDO_PAGAMENTO` | `CANCELADO` | Batedeira ou administrador | Impossibilidade operacional com motivo. |
| `EM_PREPARO` | `PRONTO` | Batedeira | Produção concluída. |
| `EM_PREPARO` | `CANCELADO` | Batedeira ou administrador | Impossibilidade operacional com motivo. |
| `PRONTO` | `SAIU_PARA_ENTREGA` | Batedeira | Entrega iniciada. |
| `PRONTO` | `CANCELADO` | Batedeira ou administrador | Impossibilidade operacional com motivo. |
| `SAIU_PARA_ENTREGA` | `ENTREGUE` | Batedeira | Confirmação do responsável pela entrega. |
| `SAIU_PARA_ENTREGA` | `FALHA_NA_ENTREGA` | Batedeira | Motivo obrigatório. |

Estados finais não aceitam novas transições operacionais: `ENTREGUE`, `RECUSADO`, `EXPIRADO`, `CANCELADO` e `FALHA_NA_ENTREGA`.

## Casos a validar com usuários reais no piloto

- compreensão da diferença entre batedeira fechada e entrega indisponível;
- clareza do pedido mínimo de um litro;
- visibilidade da taxa de entrega e do total antes do envio;
- compreensão de que a forma de pagamento é escolhida depois do aceite, com 10 minutos para escolher e 10 para pagar o Pix;
- clareza do que acontece quando o Pix expira ou a forma de pagamento não é escolhida;
- entendimento de como abrir uma contestação e do prazo do estorno;
- destaque e urgência do prazo de aceite para a batedeira;
- compreensão dos estados e dos desfechos de falha;
- descoberta do suporte quando uma mensagem predefinida não for suficiente;
- impacto da restrição de cancelamento após o aceite.
