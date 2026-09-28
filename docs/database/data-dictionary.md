# Dicionário de dados — MVP reduzido

**Versão do schema:** 0.7
**Status:** Aprovado em 28/09/2026 (DEC-046)
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
- Um pedido possui itens e uma linha do tempo de eventos.
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

### `bairros`

Vocabulário canônico das áreas usadas em endereços e cobertura de entrega.

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `nome` | Nome único do bairro. |
| `ativo` | Indica se o bairro aceita novos vínculos e pedidos (DEC-019). |
| `criado_em`, `atualizado_em` | Datas de criação e última alteração. |

No piloto, somente o bairro Centro deverá estar habilitado para pedidos, conforme o PRD.

### `batedeiras`

Cadastro público e estado operacional dos estabelecimentos selecionados.

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `responsavel_id` | Operador responsável. Deve apontar para usuário ativo do tipo `OPERADOR`. |
| `nome`, `descricao`, `imagem_url` | Informações públicas do perfil; a imagem segue a DEC-013 e a DEC-038. |
| `telefone_operacional` | Contato restrito à operação e ao suporte; nunca exibido publicamente (PRD §13.4). |
| `endereco`, `bairro_id`, `ponto_referencia` | Localização do estabelecimento. |
| `status` | Situação administrativa (PRD §10.1): `EM_ANALISE`, `ATIVA`, `SUSPENSA` ou `DESATIVADA`. |
| `aberta` | Estado manual de abertura. |
| `entrega_disponivel` | Disponibilidade de entrega, independente de `aberta`. |
| `estimativa_minutos_min`, `estimativa_minutos_max` | Faixa estimada de entrega configurada pela batedeira e exibida como faixa (ex.: "25–35 min"); não é promessa de horário exato (PRD §12.6). |
| `criado_em`, `atualizado_em` | Datas de criação e última alteração. |

Uma batedeira só pode receber novos pedidos quando estiver ativa, aberta, com entrega disponível e atendendo o bairro selecionado.

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
| `taxa_entrega_centavos` | Taxa fixa exibida antes do envio; zero representa entrega gratuita (DEC-036). |
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
| `bairro_id` | Bairro canônico usado para verificar cobertura; no piloto, somente o Centro. |
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
| `status` | Estado operacional definido na máquina de estados do PRD. |
| `forma_pagamento` | Informação operacional: `DINHEIRO` ou `PIX_NA_ENTREGA` (DEC-030). Não representa confirmação financeira. Protótipo e MER usam os mesmos valores. |
| `subtotal_centavos` | Soma dos itens. |
| `taxa_entrega_centavos` | Taxa copiada da cobertura vigente no envio. |
| `total_centavos` | Soma exata do subtotal e da taxa. Base do faturamento do dia exibido ao operador (DEC-043). |
| `volume_total_ml` | Soma dos volumes dos itens; deve ser de pelo menos 1.000 ml. |
| `troco_para_centavos` | Valor da nota informado pelo cliente quando o pagamento for em dinheiro; maior ou igual ao total. |
| `observacao` | Instrução limitada do pedido. |
| `estimativa_minutos_min`, `estimativa_minutos_max` | Faixa copiada no envio. |
| `endereco_snapshot`, `bairro_snapshot`, `referencia_snapshot` | Endereço preservado para histórico e suporte. |
| `criado_em`, `expira_aceite_em` | Criação, que ordena a fila (DEC-010), e limite da janela fixa de cinco minutos para aceite (DEC-031). |
| `aceito_em`, `finalizado_em`, `atualizado_em` | Marcos do ciclo operacional; apoiam as métricas de tempo (PRD §5.4). |

A criação do pedido, dos itens, do evento inicial e dos snapshots deve ocorrer em uma única transação. A combinação de cliente e chave de idempotência é única.

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
- Tentativas de login são expurgadas após 24 horas e sessões encerradas ou expiradas, por rotina periódica (ADR-001).
- A revisão jurídica prevista antes do piloto pode ajustar esses prazos.

## Pontos para a implementação

- Normalizar e validar e-mail e telefone nas fronteiras da aplicação.
- Aplicar autorização no servidor e verificar o `tipo` do usuário em todos os vínculos.
- Impedir alteração de snapshots e valores depois do envio do pedido.
- Executar transições com controle de concorrência e registrar o evento correspondente na mesma transação.
- Não tratar `PIX_NA_ENTREGA` como pagamento confirmado ou conciliado pela plataforma.
