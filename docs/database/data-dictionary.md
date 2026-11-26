# Dicionário de dados — MVP reduzido

**Versão do schema:** 0.11 (PRD 2.7; validado em MySQL 8.0 em 25/11/2026)
**Status:** Base aprovada em 28/09/2026 (DEC-046); schema 0.11 e este dicionário atualizados em 25/11/2026 (DEC-056 a DEC-061), aguardando revisão do responsável
**Banco previsto:** MySQL 8+
**Fonte estrutural oficial:** [`../../database/schema.sql`](../../database/schema.sql)

Este documento descreve o significado funcional dos dados do MVP e a regra de negócio que justifica cada campo. Tipos, nulabilidade, índices e restrições executáveis permanecem definidos oficialmente no schema SQL. A visão conceitual (entidades, cardinalidades e decisões de modelagem) está no [MER inicial](../product/mer-eer-inicial.md).

## Convenções

- Chaves primárias usam `BIGINT UNSIGNED AUTO_INCREMENT`.
- Valores monetários são armazenados em centavos e volumes em mililitros.
- Datas operacionais usam `TIMESTAMP`; a aplicação deverá persistir e processar horários de forma consistente e apresentá-los no fuso de Cametá.
- Campos `ativo`, `status` e equivalentes implementam desativação lógica. Registros com histórico operacional não deverão ser apagados fisicamente.
- Campos terminados em `_snapshot` preservam os dados apresentados e cobrados no momento do pedido.
- Regras dependentes do tipo do usuário ou da máquina de estados são validadas pela aplicação dentro de transações, pois não podem ser expressas integralmente pelas chaves estrangeiras atuais.

## Visão dos relacionamentos

- Um usuário do tipo `OPERADOR` pode ser responsável por, no máximo, uma batedeira no piloto.
- Uma batedeira possui horários, bairros atendidos, produtos e pedidos.
- Um usuário do tipo `CLIENTE` possui até dois endereços ativos (DEC-040) e pedidos.
- Um usuário pode ter várias sessões; tentativas de login são registradas pelo e-mail informado e pela origem, sem vínculo com o usuário (ADR-001).
- Um pedido possui itens e uma linha do tempo de eventos; pode ter um pagamento (Pix), que pode ter estornos, e contestações (novos no schema 0.8).
- Ações administrativas relevantes geram eventos de auditoria.

## Tabelas

### `usuarios`

Identidades autenticáveis dos clientes, operadores de batedeira e administradores.

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `nome` | Nome usado na identificação do usuário. |
| `email` | Identificador de acesso único. Deve ser normalizado antes da persistência. |
| `telefone` | Contato operacional; não deve ser exposto publicamente. Obrigatório para `CLIENTE` (restrição `ck_usuarios_telefone_cliente`) e opcional para `OPERADOR` e `ADMINISTRADOR`, cujo cadastro assistido não o exige; o contato operacional da batedeira fica em `batedeiras.telefone_operacional`. |
| `senha_hash` | Hash seguro da senha; nunca contém senha em texto puro. |
| `tipo` | Papel único no MVP (PRD §16.1): `CLIENTE`, `OPERADOR` (operador responsável pela batedeira) ou `ADMINISTRADOR`. A especialização é implementada nesta tabela única; a coerência entre `tipo` e os vínculos (ex.: `responsavel_id`, `cliente_id`) é validada pela aplicação. |
| `status` | Controle de acesso: `ATIVO`, `BLOQUEADO` ou `DESATIVADO`. Bloqueio e reativação são ações administrativas com motivo obrigatório, registrado em `eventos_auditoria.detalhes`; o motivo não é duplicado nesta tabela. Bloqueio ou desativação encerram todas as sessões ativas do usuário (ADR-001). Cliente bloqueado não faz login nem envia pedido. |
| `criado_em`, `atualizado_em` | Datas de criação e última alteração. |

### `sessoes`

Sessões de login ativas e encerradas (PRD §16.2, ADR-001).

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `usuario_id` | Usuário autenticado. |
| `token_hash` | Hash SHA-256 do token opaco enviado ao navegador em cookie `httpOnly`; o token em si nunca é armazenado. |
| `criado_em` | Momento do login; cada login gera um token novo. |
| `expira_em` | Limite de validade da sessão: 30 dias para cliente, estendido a cada uso; 12 horas para operador e administrador, sem renovação. |
| `encerrada_em` | Preenchido ao sair da conta ou quando a conta é bloqueada ou desativada; sessão com valor preenchido não autentica. |

Sessões encerradas ou expiradas são removidas por rotina periódica.

### `tentativas_login`

Registro mínimo usado para limitar tentativas de login (PRD §16.2, ADR-001).

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `email` | E-mail normalizado informado na tentativa, exista ou não uma conta com ele; base da limitação por conta. |
| `origem_hash` | HMAC-SHA-256 do IP de origem com um segredo do servidor; base da limitação por origem. O IP em texto nunca é guardado. |
| `sucesso` | Indica se a tentativa autenticou o usuário. |
| `criado_em` | Momento da tentativa; define a janela de contagem das falhas. |

Não guarda o IP em texto, o navegador nem a senha digitada. Os registros são expurgados após 24 horas. Limites e tempos de espera estão na ADR-001.

### `redefinicoes_senha` *(novo no schema 0.10)*

Links de redefinição de senha de uso único (PRD §16.2; recuperação de acesso).

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `usuario_id` | Usuário que pediu a redefinição. |
| `token_hash` | Hash SHA-256 do token enviado no link; o token em si nunca é armazenado. |
| `criado_em`, `expira_em` | Momento do pedido e fim da validade (30 minutos). |
| `usada_em` | Preenchido quando a senha é trocada; token usado não vale de novo. Um novo pedido invalida os anteriores ainda não usados. |

Trocar a senha por este link encerra todas as sessões do usuário. Registros expirados ou usados são removidos por rotina periódica. Em produção o link só é enviado quando houver provedor de e-mail (DEC-035, DEC-061).

### `bairros`

Vocabulário canônico das áreas usadas em endereços e cobertura de entrega.

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `nome` | Nome único do bairro. |
| `nome_alternativo` | Nome alternativo opcional exibido entre parênteses (ex.: "São João Batista" para o Centro, DEC-057). |
| `ativo` | Indica se o bairro faz parte da lista oficial e aceita novos vínculos e pedidos. Deixa de ser habilitação individual pelo administrador (DEC-057). |
| `criado_em`, `atualizado_em` | Datas de criação e última alteração. |

A lista oficial tem 13 bairros urbanos de Cametá (`bairros_cameta.txt`, DEC-057); a zona rural e as comunidades ribeirinhas ficam fora. Cada batedeira escolhe, na lista, os bairros que atende (`batedeiras_bairros`).

### `batedeiras`

Cadastro (feito pela própria batedeira, DEC-054) e estado operacional dos estabelecimentos; a conta nasce `EM_ANALISE` e só recebe pedidos depois de ativada pelo administrador.

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `responsavel_id` | Operador responsável. Deve apontar para usuário ativo do tipo `OPERADOR`. |
| `nome`, `descricao`, `imagem_url` | Informações públicas do perfil; a imagem segue a DEC-013 e a DEC-038. |
| `telefone_operacional` | Contato restrito à operação e ao suporte; nunca exibido publicamente (PRD §13.4). |
| `endereco`, `bairro_id`, `ponto_referencia` | Localização do estabelecimento. |
| `documento_tipo`, `documento` *(novo no schema 0.9)* | CPF (11 dígitos) ou CNPJ (14 dígitos) da batedeira, só os dígitos, validados pela aplicação (DEC-055). Dado pessoal: nunca devolvido ao próprio usuário, exibido mascarado ao administrador e fora de logs, fixtures e documentação. A plataforma não o confere na Receita; a elegibilidade segue verificada fora do sistema (DEC-048). |
| `status` | Situação administrativa (PRD §10.1): `EM_ANALISE`, `ATIVA`, `SUSPENSA` ou `DESATIVADA`. |
| `aberta` | Estado manual de abertura. |
| `entrega_disponivel` | Disponibilidade de entrega, independente de `aberta`. |
| `estimativa_minutos_min`, `estimativa_minutos_max` | Faixa estimada de entrega configurada pela batedeira e exibida como faixa (ex.: "25–35 min"); não é promessa de horário exato (PRD §12.6). |
| `conta_pagamento_id` | Identificador da conta conectada da batedeira no provedor; a plataforma não guarda dados bancários nem documentos de pagamento (DEC-058). |
| `conta_pagamento_status` | `NAO_CADASTRADA`, `PENDENTE`, `VERIFICADA` ou `RECUSADA`. Somente `VERIFICADA` permite oferecer Pix; nos demais casos, só dinheiro. |
| `criado_em`, `atualizado_em` | Datas de criação e última alteração. |

Uma batedeira só pode receber novos pedidos quando estiver ativa (o que exige ao menos um bairro atendido ativo, DEC-057), aberta, com entrega disponível e atendendo o bairro selecionado.

### `horarios_funcionamento`

Intervalos regulares de funcionamento de cada batedeira.

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `batedeira_id` | Estabelecimento ao qual o intervalo pertence. |
| `dia_semana` | Dia entre `0` (domingo) e `6` (sábado). |
| `hora_abertura`, `hora_fechamento` | Limites do intervalo, sem atravessar a meia-noite. |
| `ativo` | Permite desativar um intervalo sem removê-lo. |

O fechamento manual da batedeira prevalece sobre esses horários.

### `batedeiras_bairros`

Cobertura e preço de entrega por batedeira e bairro.

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `batedeira_id`, `bairro_id` | Par único de estabelecimento e bairro atendido. |
| `taxa_entrega_centavos` | Taxa fixa exibida antes do envio; zero representa entrega gratuita (DEC-036). Definida por bairro e por batedeira (DEC-057). |
| `estimativa_minutos_min`, `estimativa_minutos_max` | Faixa estimada por bairro (DEC-057); a faixa em `batedeiras` permanece como padrão. |
| `ativo` | Indica se a cobertura aceita novos pedidos. |

### `produtos`

Catálogo administrado pela batedeira.

| Campo | Significado e regra funcional |
|---|---|
| `id`, `batedeira_id` | Identificador e estabelecimento proprietário. |
| `nome`, `descricao`, `imagem_url` | Apresentação do produto. |
| `unidade` | Descrição comercial da unidade (PRD §11), copiada para `itens_pedido.unidade_snapshot`. |
| `volume_ml` | Volume do produto: somente 500 ou 1.000 ml, validado pela aplicação (DEC-042); o banco exige apenas valor positivo. Usado também na validação do mínimo de um litro por pedido (DEC-020). |
| `preco_centavos` | Preço unitário vigente. |
| `disponivel` | Disponibilidade operacional temporária. |
| `exibir_quando_indisponivel` | Opção de manter o produto visível para consulta quando estiver temporariamente indisponível; o padrão é não exibir. |
| `ativo` | Exclusão lógica do catálogo; produto com histórico é arquivado, não apagado (PRD §11.1). Produtos inativos não são exibidos, independentemente da disponibilidade. |
| `criado_em`, `atualizado_em` | Datas de criação e última alteração; `atualizado_em` atende à "data da última alteração" do PRD §11. |

### `enderecos_clientes`

Endereços reutilizáveis de entrega do cliente: no máximo dois ativos, um principal e um secundário (DEC-040).

| Campo | Significado e regra funcional |
|---|---|
| `id`, `cliente_id` | Identificador e proprietário. `cliente_id` deve apontar para usuário do tipo `CLIENTE`. |
| `logradouro`, `numero`, `complemento` | Componentes do endereço. |
| `bairro_id` | Bairro canônico da lista oficial, usado para verificar cobertura e filtrar batedeiras (DEC-057). |
| `ponto_referencia` | Informação opcional para apoiar a entrega. |
| `principal` | Endereço sugerido por padrão no pedido. A aplicação garante exatamente um principal quando houver endereço ativo e no máximo dois endereços ativos por cliente; o cliente pode alternar o principal, editar ou remover qualquer um. |
| `ativo` | Exclusão lógica. |
| `criado_em`, `atualizado_em` | Datas de criação e última alteração. |

### `pedidos`

Registro central da solicitação e do estado operacional da entrega.

| Campo | Significado e regra funcional |
|---|---|
| `id`, `codigo` | Identificador interno e código público único exibido ao cliente e ao suporte (ex.: `AC-` seguido de 20 caracteres hexadecimais), não sequencial. |
| `chave_idempotencia` | Token do cliente usado para impedir reenvio duplicado. |
| `cliente_id`, `batedeira_id` | Participantes do pedido. O telefone de contato é lido de `usuarios.telefone` do cliente, sem cópia no pedido (ver MER, decisões de modelagem). |
| `endereco_cliente_id` | Referência opcional ao endereço original; pode coexistir com o snapshot histórico. |
| `status` | Estado operacional definido na máquina de estados do PRD. Em 0.8 ganha `AGUARDANDO_PAGAMENTO` (Pix escolhido; até 10 minutos para pagar). |
| `forma_pagamento` | Em 0.7 era `DINHEIRO` ou `PIX_NA_ENTREGA`, obrigatório no envio. Em 0.8 é nulo até o cliente escolher, depois do aceite, entre `DINHEIRO` e `PIX` (DEC-056); `PIX_NA_ENTREGA` deixa de existir. A confirmação do Pix está em `pagamentos`, não aqui. |
| `escolha_pagamento_expira_em` | Obrigatório em `ACEITO`. Limite de 10 minutos, contado do aceite, para o cliente escolher a forma de pagamento; vencido sem escolha, o pedido é cancelado sem custo (DEC-059). |
| `subtotal_centavos` | Soma dos itens. |
| `taxa_entrega_centavos` | Taxa copiada da cobertura vigente no envio. |
| `total_centavos` | Soma exata do subtotal e da taxa. Base do faturamento do dia exibido ao operador (DEC-043, DEC-058): dinheiro entra na entrega; Pix, na confirmação do pagamento. |
| `volume_total_ml` | Soma dos volumes dos itens; deve ser de pelo menos 1.000 ml. |
| `troco_para_centavos` | Valor da nota informado pelo cliente quando o pagamento for em dinheiro; maior ou igual ao total. Preenchido só depois do aceite. |
| `observacao` | Instrução limitada do pedido. |
| `estimativa_minutos_min`, `estimativa_minutos_max` | Faixa copiada no envio. |
| `endereco_snapshot`, `bairro_snapshot`, `referencia_snapshot` | Endereço preservado para histórico e suporte. `endereco_snapshot` guarda rua, número e complemento em um só texto. |
| `telefone_snapshot` *(novo no schema 0.11)* | Telefone de contato informado no pedido (só dígitos, com DDD); visível à batedeira e ao administrador para a entrega. Pode diferir do telefone da conta. |
| `criado_em`, `expira_aceite_em` | Criação, que ordena a fila (DEC-010), e limite da janela fixa de cinco minutos para aceite (DEC-031). |
| `aceito_em`, `finalizado_em`, `atualizado_em` | Marcos do ciclo operacional; apoiam as métricas de tempo (PRD §5.4). |

A criação do pedido, dos itens, do evento inicial e dos snapshots deve ocorrer em uma única transação. A combinação de cliente e chave de idempotência é única.

### `pagamentos` *(novo no schema 0.8)*

Cobrança Pix de um pedido, criada quando o cliente escolhe Pix depois do aceite (DEC-056). No máximo um por pedido; Pix expirado encerra o pedido e o cliente reinicia com outro (DEC-058). Os nomes dos campos externos dependem do provedor (ADR).

| Campo | Significado e regra funcional |
|---|---|
| `id`, `pedido_id` | Identificador e pedido (único). |
| `provedor`, `provedor_pagamento_id` | Provedor e identificador externo da cobrança; único por provedor. |
| `status` | `PENDENTE`, `CONFIRMADO`, `EXPIRADO` ou `ESTORNADO` (inclui estorno total). |
| `valor_centavos` | Valor cobrado, igual a `pedidos.total_centavos`. |
| `expira_em` | Limite de 10 minutos para pagar. |
| `confirmado_em` | Momento da confirmação pelo provedor; define o dia do Pix no faturamento. |
| `criado_em`, `atualizado_em` | Datas de criação e última alteração. |

Não guarda chave Pix, dados bancários nem dados do pagador além do necessário. Toda mudança de `status` deve gerar evento em `eventos_pedido` com origem automática (webhook) ou autor humano.

### `estornos` *(novo no schema 0.8)*

Devolução, total ou parcial, de um pagamento confirmado, feita pela batedeira ou pelo administrador (DEC-056, DEC-058).

| Campo | Significado e regra funcional |
|---|---|
| `id`, `pagamento_id` | Identificador e pagamento estornado. |
| `contestacao_id` | Contestação que originou o estorno, quando houver. |
| `origem` | `CANCELAMENTO_PEDIDO` ou `FALHA_ENTREGA`. |
| `valor_centavos` | Valor devolvido. |
| `prazo_em` | Limite de 24 h: contado do cancelamento do pedido pago ou, na falha de entrega, da abertura da contestação. |
| `status` | `PENDENTE`, `CONCLUIDO` ou `FALHOU`. |
| `usuario_id` | Operador ou administrador que realizou o estorno. |
| `provedor_estorno_id` | Identificador externo, quando existir. |
| `concluido_em` | Data em que o estorno ocorreu; é o dia em que o valor é descontado do faturamento, sem alterar dias fechados. |
| `criado_em` | Momento da solicitação. |

### `contestacoes` *(novo no schema 0.8)*

Disputa aberta pelo cliente e decidida pelo administrador (PRD §14.3, DEC-058). Uma aberta por pedido por vez.

| Campo | Significado e regra funcional |
|---|---|
| `id`, `pedido_id`, `cliente_id` | Identificador, pedido e cliente que abriu. |
| `motivo` | `PRODUTO_MAU_ESTADO`, `ENTREGA_NAO_RECEBIDA`, `PEDIDO_DIFERENTE`, `PIX_SEM_ANDAMENTO_OU_ESTORNO_NAO_REALIZADO` ou `VALOR_DIFERENTE`. |
| `descricao` | Texto limitado do cliente; sem dados sensíveis desnecessários. |
| `status` | `ABERTA`, `PROCEDENTE` ou `IMPROCEDENTE`. |
| `responder_ate` | Prazo da primeira resposta (1 hora após a abertura no piloto); base do alerta no painel do administrador. |
| `primeira_resposta_em` | Momento da primeira resposta do administrador. |
| `decidida_por`, `decidida_em`, `decisao` | Administrador que decidiu, momento e justificativa curta. |
| `criado_em` | Abertura. Só pode ocorrer a partir da confirmação do pagamento (Pix) ou do aceite (dinheiro) e até 24 h depois da entrega ou da falha. |

### `eventos_webhook` *(novo no schema 0.8)*

Registro de cada notificação recebida do provedor, base da idempotência e da auditoria (DEC-056).

| Campo | Significado e regra funcional |
|---|---|
| `id`, `pagamento_id` | Identificador e pagamento relacionado, quando identificado. |
| `provedor`, `evento_externo_id` | Provedor e identificador do evento; par único: o mesmo evento recebido de novo não é reprocessado. |
| `tipo` | Tipo do evento (ex.: pagamento confirmado, estorno concluído). |
| `assinatura_valida` | Resultado da verificação de assinatura; eventos inválidos são registrados e ignorados. |
| `recebido_em`, `processado_em` | Momentos de recebimento e processamento. |

Não guarda segredos nem o conteúdo bruto além do necessário à auditoria.

### `itens_pedido`

Itens e valores imutáveis que compõem o pedido.

| Campo | Significado e regra funcional |
|---|---|
| `id`, `pedido_id` | Identificador e pedido proprietário. |
| `produto_id` | Referência opcional ao produto atual. |
| `nome_produto_snapshot`, `unidade_snapshot`, `volume_unitario_ml_snapshot` | Descrição histórica do produto comprado. |
| `preco_unitario_centavos` | Preço unitário histórico. |
| `quantidade` | Quantidade positiva. |
| `subtotal_centavos` | Produto exato de preço e quantidade. |
| `observacao` | Instrução limitada do item. |

### `eventos_pedido`

Linha do tempo imutável das alterações e comunicações operacionais.

| Campo | Significado e regra funcional |
|---|---|
| `id`, `pedido_id` | Identificador e pedido relacionado. |
| `usuario_id` | Autor humano, quando aplicável. |
| `origem_processo` | Identificação do processo automático quando não houver autor humano. |
| `tipo` | Natureza do evento. |
| `status_anterior`, `status_novo` | Transição registrada quando aplicável. |
| `motivo`, `mensagem` | Contexto limitado para suporte e auditoria. O motivo é obrigatório (pela aplicação) em recusa, falha de entrega e cancelamento após aceite (PRD §12.4, §12.5, §13.2); a mensagem guarda mensagem operacional predefinida (PRD §13.4) ou observação administrativa. Não deve conter dados sensíveis desnecessários. |
| `criado_em` | Momento imutável do evento. |

As atualizações exibidas ao cliente e os alertas do painel (PRD §15) são derivados desta tabela e dos campos de estado e prazo de `pedidos`; o MVP não mantém uma tabela própria de notificações nem persiste marcação de leitura, pois Web Push, SMS e e-mails transacionais estão fora do escopo (DEC-035).

Ações administrativas sobre um pedido específico, como o cancelamento por impossibilidade operacional, são registradas aqui, com o administrador como autor, para ficarem visíveis ao cliente e ao operador (PRD §15.1).

Exatamente um entre `usuario_id` e `origem_processo` deve ser informado. Pedidos e autores com eventos associados não devem ser apagados fisicamente.

### `eventos_auditoria`

Trilha das ações administrativas que não pertencem exclusivamente à linha do tempo de um pedido.

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `usuario_id` | Administrador responsável pela ação. |
| `acao` | Código estável da operação realizada. |
| `entidade_tipo`, `entidade_id` | Referência lógica à entidade afetada. |
| `detalhes` | Metadados mínimos em JSON, sem segredos ou dados pessoais desnecessários. Em bloqueio e reativação de conta, contém o motivo informado pelo administrador. |
| `criado_em` | Momento imutável da ação. |

## Retenção e exclusão

- Usuários, batedeiras, produtos, bairros e endereços devem usar seus estados de desativação sempre que houver histórico relacionado.
- Pedidos, itens e eventos constituem histórico operacional e não devem ser removidos por fluxos comuns da aplicação.
- Política provisória (DEC-047): pedidos, itens e eventos são guardados por 5 anos. Na exclusão da conta, nome, telefone, e-mail e endereços do cliente são removidos da conta e dos pedidos antigos (`usuarios`, `enderecos_clientes` e os campos `_snapshot` de endereço), preservando valores, datas e estados.
- Pagamentos, estornos, contestações e eventos de webhook são histórico financeiro e de auditoria: seguem o prazo de retenção dos pedidos e não são apagados por fluxos comuns; a exclusão da conta não remove valores, datas e estados (DEC-047).
- Tentativas de login são expurgadas após 24 horas e sessões encerradas ou expiradas, por rotina periódica (ADR-001).
- A revisão jurídica prevista antes do piloto pode ajustar esses prazos.

## Pontos para a implementação

- Normalizar e validar e-mail e telefone nas fronteiras da aplicação.
- Aplicar autorização no servidor e verificar o `tipo` do usuário em todos os vínculos.
- Impedir alteração de snapshots e valores depois do envio do pedido.
- Executar transições com controle de concorrência e registrar o evento correspondente na mesma transação.
- Tratar o Pix como pago somente quando `pagamentos.status` for `CONFIRMADO` por webhook verificado e idempotente; o dinheiro não gera registro de pagamento na plataforma.
- Executar a confirmação do Pix, a mudança de estado do pedido e o evento correspondente na mesma transação.
- Calcular o faturamento do dia a partir de `pedidos`, `pagamentos` e `estornos`, sem armazená-lo.
