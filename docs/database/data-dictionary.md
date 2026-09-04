# Dicionário de dados — MVP reduzido

**Versão do schema:** 0.4
**Banco previsto:** MySQL 8+
**Fonte estrutural oficial:** [`../../database/schema.sql`](../../database/schema.sql)

Este documento descreve o significado funcional dos dados do MVP. Tipos, nulabilidade, índices e restrições executáveis permanecem definidos oficialmente no schema SQL.

## Convenções

- Chaves primárias usam `BIGINT UNSIGNED AUTO_INCREMENT`.
- Valores monetários são armazenados em centavos e volumes em mililitros.
- Datas operacionais usam `TIMESTAMP`; a aplicação deverá persistir e processar horários de forma consistente e apresentá-los no fuso de Cametá.
- Campos `ativo`, `status` e equivalentes implementam desativação lógica. Registros com histórico operacional não deverão ser apagados fisicamente.
- Campos terminados em `_snapshot` preservam os dados apresentados e cobrados no momento do pedido.
- Regras dependentes do tipo do usuário ou da máquina de estados são validadas pela aplicação dentro de transações, pois não podem ser expressas integralmente pelas chaves estrangeiras atuais.

## Visão dos relacionamentos

- Um usuário do tipo `BATEDEIRA` pode ser responsável por, no máximo, uma batedeira no piloto.
- Uma batedeira possui horários, bairros atendidos, produtos e pedidos.
- Um usuário do tipo `CLIENTE` possui endereços e pedidos.
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
| `telefone` | Contato operacional; não deve ser exposto publicamente. |
| `senha_hash` | Hash seguro da senha; nunca contém senha em texto puro. |
| `tipo` | Papel único no MVP: `CLIENTE`, `BATEDEIRA` ou `ADMINISTRADOR`. |
| `status` | Controle de acesso: `ATIVO`, `BLOQUEADO` ou `DESATIVADO`. |
| `criado_em`, `atualizado_em` | Datas de criação e última alteração. |

### `bairros`

Vocabulário canônico das áreas usadas em endereços e cobertura de entrega.

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `nome` | Nome único do bairro. |
| `ativo` | Indica se o bairro aceita novos vínculos e pedidos. |
| `criado_em`, `atualizado_em` | Datas de criação e última alteração. |

No piloto, somente o bairro Centro deverá estar habilitado para pedidos, conforme o PRD.

### `batedeiras`

Cadastro público e estado operacional dos estabelecimentos selecionados.

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `responsavel_id` | Operador responsável. Deve apontar para usuário ativo do tipo `BATEDEIRA`. |
| `nome`, `descricao`, `imagem_url` | Informações públicas do perfil. |
| `telefone_operacional` | Contato restrito à operação e ao suporte. |
| `endereco`, `bairro_id`, `ponto_referencia` | Localização do estabelecimento. |
| `status` | Situação administrativa: `EM_ANALISE`, `ATIVA`, `SUSPENSA` ou `DESATIVADA`. |
| `aberta` | Estado manual de abertura. |
| `entrega_disponivel` | Disponibilidade de entrega, independente de `aberta`. |
| `estimativa_minutos_min`, `estimativa_minutos_max` | Faixa operacional informada ao cliente. |
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
| `taxa_entrega_centavos` | Taxa fixa exibida antes do envio; zero representa entrega gratuita. |
| `ativo` | Indica se a cobertura aceita novos pedidos. |

### `produtos`

Catálogo administrado pela batedeira.

| Campo | Significado e regra funcional |
|---|---|
| `id`, `batedeira_id` | Identificador e estabelecimento proprietário. |
| `nome`, `descricao`, `tipo`, `imagem_url` | Apresentação do produto. |
| `unidade` | Descrição comercial da unidade. |
| `volume_ml` | Volume usado inclusive na validação do mínimo de um litro. |
| `preco_centavos` | Preço unitário vigente. |
| `disponivel` | Disponibilidade operacional temporária. |
| `exibir_quando_indisponivel` | Opção de manter o produto visível para consulta quando estiver temporariamente indisponível; o padrão é não exibir. |
| `ativo` | Exclusão lógica do catálogo. Produtos inativos não são exibidos, independentemente da disponibilidade. |
| `criado_em`, `atualizado_em` | Datas de criação e última alteração. |

### `enderecos_clientes`

Endereços reutilizáveis de entrega do cliente.

| Campo | Significado e regra funcional |
|---|---|
| `id`, `cliente_id` | Identificador e proprietário. `cliente_id` deve apontar para usuário do tipo `CLIENTE`. |
| `logradouro`, `numero`, `complemento` | Componentes do endereço. |
| `bairro_id` | Bairro canônico usado para verificar cobertura. |
| `ponto_referencia` | Informação opcional para apoiar a entrega. |
| `principal` | Preferência do cliente; a aplicação garante no máximo um endereço principal ativo. |
| `ativo` | Exclusão lógica. |
| `criado_em`, `atualizado_em` | Datas de criação e última alteração. |

### `pedidos`

Registro central da solicitação e do estado operacional da entrega.

| Campo | Significado e regra funcional |
|---|---|
| `id`, `codigo` | Identificador interno e código público único. |
| `chave_idempotencia` | Token do cliente usado para impedir reenvio duplicado. |
| `cliente_id`, `batedeira_id` | Participantes do pedido. |
| `endereco_cliente_id` | Referência opcional ao endereço original; pode coexistir com o snapshot histórico. |
| `status` | Estado operacional definido na máquina de estados do PRD. |
| `forma_pagamento` | Informação operacional: `DINHEIRO` ou `PIX_NA_ENTREGA`. Não representa confirmação financeira. |
| `subtotal_centavos` | Soma dos itens. |
| `taxa_entrega_centavos` | Taxa copiada da cobertura vigente no envio. |
| `total_centavos` | Soma exata do subtotal e da taxa. |
| `volume_total_ml` | Soma dos volumes dos itens; deve ser de pelo menos 1.000 ml. |
| `troco_para_centavos` | Valor entregue pelo cliente quando o pagamento for em dinheiro. |
| `observacao` | Instrução limitada do pedido. |
| `estimativa_minutos_min`, `estimativa_minutos_max` | Faixa copiada no envio. |
| `endereco_snapshot`, `bairro_snapshot`, `referencia_snapshot` | Endereço preservado para histórico e suporte. |
| `criado_em`, `expira_aceite_em` | Início e limite da janela fixa de cinco minutos. |
| `aceito_em`, `finalizado_em`, `atualizado_em` | Marcos do ciclo operacional. |

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
| `motivo`, `mensagem` | Contexto limitado para suporte e auditoria. Não deve conter dados sensíveis desnecessários. |
| `criado_em` | Momento imutável do evento. |

Exatamente um entre `usuario_id` e `origem_processo` deve ser informado. Pedidos e autores com eventos associados não devem ser apagados fisicamente.

### `eventos_auditoria`

Trilha das ações administrativas que não pertencem exclusivamente à linha do tempo de um pedido.

| Campo | Significado e regra funcional |
|---|---|
| `id` | Identificador interno. |
| `usuario_id` | Administrador responsável pela ação. |
| `acao` | Código estável da operação realizada. |
| `entidade_tipo`, `entidade_id` | Referência lógica à entidade afetada. |
| `detalhes` | Metadados mínimos em JSON, sem segredos ou dados pessoais desnecessários. |
| `criado_em` | Momento imutável da ação. |

## Retenção e exclusão

- Usuários, batedeiras, produtos, bairros e endereços devem usar seus estados de desativação sempre que houver histórico relacionado.
- Pedidos, itens e eventos constituem histórico operacional e não devem ser removidos por fluxos comuns da aplicação.
- Solicitações legais de exclusão ou anonimização exigirão procedimento específico, com preservação apenas dos dados necessários às obrigações aplicáveis.
- Prazos definitivos de retenção dependem da revisão jurídica e de privacidade prevista antes do piloto.

## Pontos para a implementação

- Normalizar e validar e-mail e telefone nas fronteiras da aplicação.
- Aplicar autorização no servidor e verificar o `tipo` do usuário em todos os vínculos.
- Impedir alteração de snapshots e valores depois do envio do pedido.
- Executar transições com controle de concorrência e registrar o evento correspondente na mesma transação.
- Não tratar `PIX_NA_ENTREGA` como pagamento confirmado ou conciliado pela plataforma.
