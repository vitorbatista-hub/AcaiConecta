# Fluxos operacionais do MVP

**Status:** Base para prototipação e testes de usabilidade
**Escopo:** Piloto no bairro Centro, em Cametá/PA

Este documento transforma as regras do [PRD vigente](PRD.md) e do [registro de decisões](decisions.md) em sequências operacionais. Ele não substitui essas fontes: divergências deverão ser resolvidas nelas antes da implementação.

## Princípios comuns

- O MVP atende somente pedidos para entrega.
- A batedeira precisa estar `ATIVA`, aberta e com entrega disponível para receber pedidos.
- Cada pedido deve totalizar pelo menos 1.000 ml.
- A forma de pagamento é apenas uma informação operacional: dinheiro ou Pix na entrega.
- A plataforma não gera, confirma, concilia nem devolve pagamentos.
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
8. O cliente escolhe ou cadastra um endereço no bairro atendido.
9. O sistema exibe subtotal, taxa de entrega, total e faixa estimada antes da confirmação.
10. O cliente informa dinheiro ou Pix na entrega. Para dinheiro, pode informar o valor para troco.
11. O cliente pode acrescentar observações limitadas aos itens ou ao pedido.
12. Ao confirmar, o sistema revalida disponibilidade, catálogo, preços, cobertura e total.
13. O sistema cria o pedido em `AGUARDANDO_ACEITE`, preserva os snapshots e inicia o prazo de cinco minutos.
14. O cliente acompanha a linha do tempo dentro da aplicação.

### Resposta e acompanhamento

- Se a batedeira aceitar dentro do prazo, o pedido muda para `ACEITO` e segue a operação.
- Se recusar, o pedido muda para `RECUSADO` e apresenta o motivo.
- Se não responder em cinco minutos, o sistema muda o pedido para `EXPIRADO`.
- Antes do aceite, o cliente pode cancelar diretamente, levando o pedido a `CANCELADO`.
- Depois do aceite, solicitações de cancelamento do cliente são encaminhadas ao suporte e não alteram automaticamente o estado.
- O cliente acompanha `EM_PREPARO`, `PRONTO`, `SAIU_PARA_ENTREGA` e o desfecho `ENTREGUE` ou `FALHA_NA_ENTREGA`.
- Reclamações e divergências seguem para o suporte do piloto, sem contestação formal dentro da aplicação.

## Fluxo da batedeira

### Preparação para operar

1. O operador responsável acessa o painel com uma conta ativa.
2. O sistema confirma que a batedeira está administrativamente `ATIVA`.
3. O operador mantém catálogo, preços e disponibilidade dos produtos atualizados e decide se cada produto temporariamente indisponível continua visível para consulta.
4. O operador configura horários, estado aberto ou fechado e disponibilidade de entrega.
5. O operador mantém o painel aberto durante o horário do piloto para receber alertas visuais.

### Atendimento do pedido

1. Um novo pedido aparece destacado em `AGUARDANDO_ACEITE`, com contagem do prazo restante.
2. A fila é ordenada pelo horário de criação.
3. O operador analisa itens, endereço, observações, forma de pagamento e estimativa.
4. Em até cinco minutos, aceita ou recusa o pedido.
5. A recusa exige um motivo previsto ou descrição quando a opção for “outro”.
6. Ao aceitar, o operador inicia o preparo e registra `EM_PREPARO`.
7. Quando a produção termina, registra `PRONTO`.
8. Quando o responsável inicia a entrega, registra `SAIU_PARA_ENTREGA`.
9. Após confirmação do responsável pela entrega, registra `ENTREGUE`.
10. Se a entrega não puder ser concluída, registra `FALHA_NA_ENTREGA` com motivo.

### Exceções

- Um pedido expirado não pode ser aceito posteriormente.
- Entre `ACEITO` e antes de `SAIU_PARA_ENTREGA`, a batedeira pode cancelar somente por impossibilidade operacional e deve informar o motivo.
- Após `SAIU_PARA_ENTREGA`, não há cancelamento comum; o desfecho é entrega ou falha na entrega.
- A confirmação do pagamento na entrega ocorre diretamente entre cliente e batedeira e não gera estado financeiro na plataforma.
- Problemas fora das mensagens predefinidas são encaminhados ao suporte.

## Fluxo do administrador

### Cadastro e operação do piloto

1. O administrador confirma externamente a elegibilidade de uma batedeira previamente selecionada.
2. Cadastra de forma assistida a batedeira e seu único operador responsável, sem copiar documentos para o sistema.
3. Configura ou revisa perfil, localização, cobertura e taxa de entrega.
4. Ativa a batedeira quando os requisitos aplicáveis estiverem atendidos.
5. Registra em auditoria as ações de ativação, suspensão, reativação e alterações administrativas relevantes.

### Suporte e supervisão

1. O administrador consulta pedidos, linha do tempo e contexto operacional.
2. Registra intervenções administrativas relacionadas ao pedido.
3. Pode cancelar um pedido aceito, antes de `SAIU_PARA_ENTREGA`, somente por impossibilidade operacional e com motivo.
4. Trata reclamações e incidentes pelo canal de suporte definido para o piloto.
5. Registra incidentes no diário operacional externo, sem criar contestação formal no sistema.
6. Acompanha métricas do piloto e preserva a definição vigente durante sua execução.
7. Suspende uma batedeira quando necessário; a suspensão bloqueia novos pedidos, mas não apaga o histórico.

## Matriz de transições do pedido

| Estado atual | Próximo estado | Responsável | Condição |
|---|---|---|---|
| `AGUARDANDO_ACEITE` | `ACEITO` | Batedeira | Dentro dos cinco minutos. |
| `AGUARDANDO_ACEITE` | `RECUSADO` | Batedeira | Motivo obrigatório. |
| `AGUARDANDO_ACEITE` | `EXPIRADO` | Sistema | Prazo encerrado sem resposta. |
| `AGUARDANDO_ACEITE` | `CANCELADO` | Cliente | Antes do aceite. |
| `ACEITO` | `EM_PREPARO` | Batedeira | Início do preparo. |
| `ACEITO` | `CANCELADO` | Batedeira ou administrador | Impossibilidade operacional com motivo. |
| `EM_PREPARO` | `PRONTO` | Batedeira | Produção concluída. |
| `EM_PREPARO` | `CANCELADO` | Batedeira ou administrador | Impossibilidade operacional com motivo. |
| `PRONTO` | `SAIU_PARA_ENTREGA` | Batedeira | Entrega iniciada. |
| `PRONTO` | `CANCELADO` | Batedeira ou administrador | Impossibilidade operacional com motivo. |
| `SAIU_PARA_ENTREGA` | `ENTREGUE` | Batedeira | Confirmação do responsável pela entrega. |
| `SAIU_PARA_ENTREGA` | `FALHA_NA_ENTREGA` | Batedeira | Motivo obrigatório. |

Estados finais não aceitam novas transições operacionais: `ENTREGUE`, `RECUSADO`, `EXPIRADO`, `CANCELADO` e `FALHA_NA_ENTREGA`.

## Casos que o protótipo deverá validar

- compreensão da diferença entre batedeira fechada e entrega indisponível;
- clareza do pedido mínimo de um litro;
- visibilidade da taxa de entrega e do total antes do envio;
- entendimento de que o Pix será realizado somente na entrega;
- destaque e urgência do prazo de aceite para a batedeira;
- compreensão dos estados e dos desfechos de falha;
- descoberta do suporte quando uma mensagem predefinida não for suficiente;
- impacto da restrição de cancelamento após o aceite.
