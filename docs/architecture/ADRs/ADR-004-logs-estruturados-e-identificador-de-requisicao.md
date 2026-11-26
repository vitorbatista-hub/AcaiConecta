# ADR-004 — Logs estruturados, identificador de requisição e redação de dados

**Estado:** Proposta, **não aprovada e não implementada** (o código que a aplicava foi removido com o MVP descartado, DEC-053). Segue como base para a observabilidade da ADR-003; precisa de aprovação antes de ser implementada (DEC-061).
**Data:** 2026-11-23
**Responsável pela decisão:** responsável pelo projeto
**Relacionados:** PRD 2.7 §17, §18.5 e §23; backlog 1.5 e 7.7; [ADR-003](ADR-003-infraestrutura.md) §4; [arquitetura técnica](../../product/arquitetura-tecnica.md) §10

## Contexto

O PRD exige registro centralizado de erros, identificação de requisições e pedidos para o suporte e alertas para falhas críticas (§18.5), sem coletar nem expor dados pessoais além do necessário (§17). Sem isso, um erro durante o piloto fica invisível até o usuário reclamar, e um caso relatado por telefone não pode ser ligado ao registro correspondente. A ADR-003 prevê logs estruturados em JSON na saída padrão, coletados pela plataforma, e deixa a escolha de um serviço de rastreamento de erros em aberto.

## Decisão proposta

1. **Formato.** Uma linha JSON por evento, escrita em `stdout` (informação) e `stderr` (aviso e erro), com `ts`, `nivel`, `evento`, `requisicaoId` e campos próprios do evento. Nível mínimo por `LOG_LEVEL` (`info` por padrão; silencioso nos testes). Sem biblioteca de log nova: a plataforma já coleta a saída padrão.
2. **Identificador de requisição.** O `proxy` dá a cada requisição um `x-request-id` (UUID), repassa-o ao servidor e o devolve na resposta. Um identificador recebido só é aceito se tiver de 8 a 64 caracteres simples (letras, dígitos e hífen), para impedir injeção de linhas falsas no log.
3. **Correlação com o pedido.** Os eventos de negócio levam o código do pedido (`pedido`, no formato `AC-XXXXXXXX`, que o cliente já vê e informa ao suporte): `pedido_criado`, `pedido_repetido_ignorado`, `pedido_transicao` e `pedidos_expirados`. O suporte parte do código ou do identificador de requisição e encontra as linhas relacionadas.
4. **Erros de servidor.** O gancho `onRequestError` registra `erro_servidor` para todo erro não tratado de página, ação ou rota, com `requisicaoId`, `digest`, método, caminho sem query string, rota e a descrição do erro. A tela de erro mostra ao usuário o `digest`, que liga a tela à linha do log. Recusas esperadas de regra de negócio (`acao_recusada`) e falhas de login (`login_recusado`) ficam como avisos, só com tipo e código.
5. **Redação.** Todo campo passa por uma lista de omissão por nome (credenciais, tokens, cookies, e-mail, telefone, endereço, nome, motivo, observação, mensagem e outros textos livres) e por limite de tamanho e profundidade. Erros são descritos por **tipo, código e primeiro ponto do código do projeto, sem a mensagem**, porque mensagens de banco e de bibliotecas podem trazer valores de consulta. O log nunca lança erro nem derruba a operação.
6. **Tarefas periódicas.** O agendador registra `pedidos_expirados`, `expurgo_autenticacao` e `agendador_falhou`.

## Alternativas consideradas

- **Biblioteca de log (pino, winston).** Descartada por ora: o formato é simples e a coleta é da plataforma; avaliar se a necessidade crescer.
- **Serviço de rastreamento de erros e telemetria (Sentry, OpenTelemetry).** Adiada: exige decisão de fornecedor, região e envio de dados a terceiros, ligada à revisão de privacidade e à ADR-003. A saída em JSON pode alimentá-lo depois sem mudar o código dos eventos.
- **Registrar a mensagem completa do erro.** Descartada: arriscaria gravar dados pessoais e valores de consulta.

## Consequências

- O suporte consegue partir do código do pedido, do identificador de requisição ou do código mostrado na tela de erro.
- **Limitação conhecida:** o próprio Next.js imprime o erro em `stderr` além do log estruturado, e essa saída pode conter a mensagem do erro. O acesso aos logs na plataforma precisa ser restrito, e a escolha do serviço de erros deve tratar isso (ADR-003 §4).
- Um alerta para erro recorrente na criação e na transição de pedido (backlog 7.7) pode ser construído sobre `erro_servidor` e `pedido_*`; não está implementado.
- Cada novo campo de log passa pela mesma lista de omissão; campos de texto livre devem ter nomes cobertos por ela.
