# ADR-002 — Atualização em tempo real de pedidos e alertas

**Estado:** Aceita
**Data:** 2026-09-28
**Responsável pela decisão:** responsável pelo projeto (exigência de tempo real); mecanismo definido a partir de recomendação técnica
**Relacionados:** PRD 2.6 §8.2, §15 e §18.2; DEC-023; DEC-031; DEC-035; [arquitetura técnica proposta](../../product/arquitetura-tecnica.md) §5; [ADR-001](ADR-001-sessoes-e-tentativas-de-login.md)

## Contexto

O PRD exige alerta visual de novo pedido enquanto o painel do operador estiver aberto (§8.2) e atualização da linha do tempo do pedido para o cliente (§15.2). Web Push, SMS e e-mails transacionais estão fora do MVP (DEC-035); a atualização acontece somente com a aplicação aberta.

A proposta inicial da arquitetura era consultar o servidor a cada 5 a 10 segundos (polling). O responsável pelo projeto decidiu, em 28/09/2026, que pedidos e alertas devem ser atualizados em tempo real. O prazo de aceite de cinco minutos (DEC-031) torna relevante cada segundo entre o envio do pedido e o alerta ao operador.

## Decisão

1. **Server-Sent Events (SSE).** O navegador abre uma conexão HTTP que o servidor mantém aberta e pela qual envia cada novo evento assim que ele é detectado. Usam SSE:
   - a fila do painel do operador, que recebe novos pedidos, cancelamentos e intervenções da própria batedeira;
   - o acompanhamento do pedido pelo cliente, que recebe os eventos dos próprios pedidos;
   - a consulta de pedidos do administrador.
2. **Origem dos eventos.** A tabela `eventos_pedido` é a fonte dos avisos. O servidor verifica novos eventos a cada 1 a 2 segundos por consulta indexada e envia somente os que o usuário conectado pode ver. Isso funciona com várias instâncias da aplicação sem um serviço de mensageria à parte. O atraso percebido fica em até cerca de 2 segundos.
3. **Retomada após queda de conexão.** Cada aviso leva o `id` do evento. Ao reconectar, o navegador informa o último `id` recebido (`Last-Event-ID`), e o servidor envia o que ficou para trás, sem perda nem duplicação.
4. **Contingência.** Se a conexão SSE falhar repetidamente, por exemplo por causa de um proxy da operadora, a tela passa a consultar o servidor periodicamente e avisa que a atualização pode atrasar. Ações do usuário, como aceitar ou recusar, continuam sendo requisições comuns, com resposta de sucesso ou falha sem ambiguidade (PRD §18.2).
5. **Autorização.** A conexão exige sessão válida (ADR-001) e aplica as mesmas regras das demais telas: o operador vê apenas a própria batedeira e o cliente, apenas os próprios pedidos. Se a sessão for encerrada ou a conta bloqueada, a conexão é fechada.

## Alternativas consideradas

- **Polling a cada 5 a 10 segundos.** Descartada como mecanismo principal por não atender à exigência de tempo real; mantida somente como contingência.
- **WebSocket.** Descartada: permite comunicação nos dois sentidos, mas o MVP só precisa enviar do servidor para o navegador. Exige protocolo e infraestrutura próprios, e o SSE funciona sobre HTTP comum e já reconecta sozinho.
- **Serviço gerenciado de tempo real (ex.: Pusher, Ably).** Descartada: seria mais uma dependência externa e mais um lugar com dados de pedidos, contrariando o risco de dependência de fornecedor (PRD §23) e a minimização de dados.

## Consequências

- **Impacto na hospedagem:** a aplicação precisa rodar em um ambiente que mantenha conexões abertas por longos períodos, como um servidor Node.js persistente ou um contêiner. Plataformas de funções sem estado com limite curto de duração por requisição não atendem sem ajustes. Isso restringe a escolha de infraestrutura, que continua sendo gate externo da Fase 3 (PRD §24.2).
- O schema não muda: `eventos_pedido` e o índice `idx_eventos_pedido_linha_tempo` já atendem às consultas. A fila do operador pode exigir um índice adicional por batedeira e evento, a confirmar na especificação de engenharia.
- Cada tela aberta mantém uma conexão e gera uma consulta leve a cada 1 a 2 segundos. No volume do piloto (3 a 5 batedeiras), o custo é desprezível; em escala maior, a verificação periódica no banco poderá ser trocada por um mecanismo de publicação de eventos sem mudar o que o navegador recebe.
- A regra do PRD §15.2 continua valendo: o operador precisa manter o painel aberto, porque não há notificação com a aplicação fechada.
