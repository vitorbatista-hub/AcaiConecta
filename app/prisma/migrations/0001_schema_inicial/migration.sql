-- AçaíConecta
-- Schema inicial do MVP reduzido para MySQL 8+
-- Versão: 0.9
-- Atualização: novembro de 2026 (PRD 2.7; DEC-056 a DEC-061; 0.9 acrescenta o CPF/CNPJ da batedeira, DEC-055)
--
-- Convenções:
--   - identificadores BIGINT AUTO_INCREMENT;
--   - valores monetários em centavos e volumes em mililitros;
--   - somente entrega, com pedido mínimo total de 1 litro;
--   - forma de pagamento escolhida depois do aceite: dinheiro na entrega ou Pix on-line
--     confirmado pelo provedor, com estorno e contestação; a plataforma não guarda
--     chave Pix, dados bancários nem documentos de pagamento;
--   - bairros urbanos canônicos, escolhidos por batedeira, com taxa e faixa por bairro;
--   - um operador responsável por batedeira durante o piloto.
--   - dias da semana numerados de 0 (domingo) a 6 (sábado).
--
-- Invariantes que deverão ser validadas também pela aplicação:
--   - responsavel_id referencia um usuário do tipo OPERADOR;
--   - cliente_id referencia um usuário do tipo CLIENTE;
--   - usuario_id de ações administrativas referencia um ADMINISTRADOR;
--   - bloqueio e reativação de conta registram o motivo em eventos_auditoria;
--   - cada cliente tem no máximo 2 endereços ativos, com exatamente um principal
--     quando houver algum (DEC-040);
--   - sessões guardam somente o hash do token; tentativas de login guardam a origem
--     apenas como HMAC do IP e são expurgadas após 24 horas (ADR-001);
--   - estados de pedido seguem exclusivamente as transições definidas no PRD;
--   - subtotal, volume e snapshots do pedido são calculados em uma transação única;
--   - uma batedeira só é ativada com ao menos um bairro atendido ativo (DEC-057);
--   - Pix só é oferecido quando conta_pagamento_status = 'VERIFICADA' (DEC-058);
--   - a confirmação do Pix, a mudança de estado do pedido e o evento correspondente
--     ocorrem na mesma transação; webhooks repetidos não são reprocessados;
--   - o prazo de 10 minutos para escolher a forma de pagamento e o de 10 minutos para
--     pagar o Pix são aplicados pela aplicação a partir de pedidos.escolha_pagamento_expira_em
--     e pagamentos.expira_em (DEC-056, DEC-059);
--   - o faturamento do dia é calculado, não armazenado (DEC-043, DEC-058);
--   - a soma dos estornos de um pagamento não ultrapassa pagamentos.valor_centavos;
--   - usuario_id em estornos referencia OPERADOR ou ADMINISTRADOR; decidida_por em
--     contestacoes referencia um ADMINISTRADOR.

CREATE TABLE usuarios (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    telefone VARCHAR(20) NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo ENUM('CLIENTE', 'OPERADOR', 'ADMINISTRADOR') NOT NULL,
    status ENUM('ATIVO', 'BLOQUEADO', 'DESATIVADO') NOT NULL DEFAULT 'ATIVO',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT ck_usuarios_telefone_cliente CHECK (
        tipo <> 'CLIENTE' OR telefone IS NOT NULL
    )
) ENGINE = InnoDB;

CREATE TABLE sessoes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em TIMESTAMP NOT NULL,
    encerrada_em TIMESTAMP NULL,

    CONSTRAINT pk_sessoes PRIMARY KEY (id),
    CONSTRAINT uq_sessoes_token UNIQUE (token_hash),
    CONSTRAINT fk_sessoes_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT ck_sessoes_expiracao CHECK (expira_em > criado_em)
) ENGINE = InnoDB;

CREATE INDEX idx_sessoes_usuario_ativas
    ON sessoes (usuario_id, encerrada_em, expira_em);

CREATE TABLE tentativas_login (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(254) NOT NULL,
    origem_hash CHAR(64) NOT NULL,
    sucesso BOOLEAN NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_tentativas_login PRIMARY KEY (id)
) ENGINE = InnoDB;

CREATE INDEX idx_tentativas_login_email_janela
    ON tentativas_login (email, criado_em);

CREATE INDEX idx_tentativas_login_origem_janela
    ON tentativas_login (origem_hash, criado_em);

CREATE TABLE bairros (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    nome_alternativo VARCHAR(100) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_bairros PRIMARY KEY (id),
    CONSTRAINT uq_bairros_nome UNIQUE (nome)
) ENGINE = InnoDB;

CREATE TABLE batedeiras (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    responsavel_id BIGINT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao VARCHAR(500) NULL,
    telefone_operacional VARCHAR(20) NULL,
    imagem_url VARCHAR(2048) NULL,
    endereco VARCHAR(255) NOT NULL,
    bairro_id BIGINT UNSIGNED NOT NULL,
    ponto_referencia VARCHAR(255) NULL,
    documento_tipo ENUM('CPF', 'CNPJ') NOT NULL,
    documento VARCHAR(14) NOT NULL,
    status ENUM('EM_ANALISE', 'ATIVA', 'SUSPENSA', 'DESATIVADA') NOT NULL DEFAULT 'EM_ANALISE',
    aberta BOOLEAN NOT NULL DEFAULT FALSE,
    entrega_disponivel BOOLEAN NOT NULL DEFAULT FALSE,
    estimativa_minutos_min SMALLINT UNSIGNED NOT NULL,
    estimativa_minutos_max SMALLINT UNSIGNED NOT NULL,
    conta_pagamento_id VARCHAR(100) NULL,
    conta_pagamento_status ENUM('NAO_CADASTRADA', 'PENDENTE', 'VERIFICADA', 'RECUSADA')
        NOT NULL DEFAULT 'NAO_CADASTRADA',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_batedeiras PRIMARY KEY (id),
    CONSTRAINT uq_batedeiras_conta_pagamento UNIQUE (conta_pagamento_id),
    CONSTRAINT uq_batedeiras_responsavel UNIQUE (responsavel_id),
    CONSTRAINT fk_batedeiras_responsavel FOREIGN KEY (responsavel_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_batedeiras_bairro FOREIGN KEY (bairro_id)
        REFERENCES bairros (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_batedeiras_estimativa CHECK (
        estimativa_minutos_min > 0
        AND estimativa_minutos_max >= estimativa_minutos_min
    ),
    CONSTRAINT ck_batedeiras_documento CHECK (
        (documento_tipo = 'CPF' AND CHAR_LENGTH(documento) = 11)
        OR (documento_tipo = 'CNPJ' AND CHAR_LENGTH(documento) = 14)
    ),
    CONSTRAINT ck_batedeiras_conta_pagamento CHECK (
        conta_pagamento_status = 'NAO_CADASTRADA' OR conta_pagamento_id IS NOT NULL
    )
) ENGINE = InnoDB;

CREATE INDEX idx_batedeiras_status_disponibilidade
    ON batedeiras (status, aberta, entrega_disponivel);
CREATE INDEX idx_batedeiras_bairro ON batedeiras (bairro_id);

CREATE TABLE horarios_funcionamento (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    batedeira_id BIGINT UNSIGNED NOT NULL,
    dia_semana TINYINT UNSIGNED NOT NULL,
    hora_abertura TIME NOT NULL,
    hora_fechamento TIME NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_horarios_funcionamento PRIMARY KEY (id),
    CONSTRAINT uq_horarios_intervalo UNIQUE (batedeira_id, dia_semana, hora_abertura, hora_fechamento),
    CONSTRAINT fk_horarios_batedeira FOREIGN KEY (batedeira_id)
        REFERENCES batedeiras (id) ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT ck_horarios_dia_semana CHECK (dia_semana BETWEEN 0 AND 6),
    CONSTRAINT ck_horarios_intervalo CHECK (hora_fechamento > hora_abertura)
) ENGINE = InnoDB;

CREATE INDEX idx_horarios_batedeira_dia
    ON horarios_funcionamento (batedeira_id, dia_semana, ativo);

CREATE TABLE batedeiras_bairros (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    batedeira_id BIGINT UNSIGNED NOT NULL,
    bairro_id BIGINT UNSIGNED NOT NULL,
    taxa_entrega_centavos INT UNSIGNED NOT NULL DEFAULT 0,
    estimativa_minutos_min SMALLINT UNSIGNED NOT NULL,
    estimativa_minutos_max SMALLINT UNSIGNED NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_batedeiras_bairros PRIMARY KEY (id),
    CONSTRAINT uq_batedeiras_bairros UNIQUE (batedeira_id, bairro_id),
    CONSTRAINT fk_batedeiras_bairros_batedeira FOREIGN KEY (batedeira_id)
        REFERENCES batedeiras (id) ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_batedeiras_bairros_bairro FOREIGN KEY (bairro_id)
        REFERENCES bairros (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_batedeiras_bairros_estimativa CHECK (
        estimativa_minutos_min > 0
        AND estimativa_minutos_max >= estimativa_minutos_min
    )
) ENGINE = InnoDB;

CREATE INDEX idx_batedeiras_bairros_busca
    ON batedeiras_bairros (bairro_id, ativo);

CREATE TABLE produtos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    batedeira_id BIGINT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao VARCHAR(500) NULL,
    unidade VARCHAR(50) NOT NULL,
    volume_ml SMALLINT UNSIGNED NOT NULL,
    preco_centavos INT UNSIGNED NOT NULL,
    imagem_url VARCHAR(2048) NULL,
    disponivel BOOLEAN NOT NULL DEFAULT TRUE,
    exibir_quando_indisponivel BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_produtos PRIMARY KEY (id),
    CONSTRAINT fk_produtos_batedeira FOREIGN KEY (batedeira_id)
        REFERENCES batedeiras (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_produtos_volume CHECK (volume_ml > 0),
    CONSTRAINT ck_produtos_preco CHECK (preco_centavos > 0)
) ENGINE = InnoDB;

CREATE INDEX idx_produtos_catalogo
    ON produtos (batedeira_id, ativo, disponivel);

CREATE TABLE enderecos_clientes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cliente_id BIGINT UNSIGNED NOT NULL,
    logradouro VARCHAR(180) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100) NULL,
    bairro_id BIGINT UNSIGNED NOT NULL,
    ponto_referencia VARCHAR(255) NULL,
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_enderecos_clientes PRIMARY KEY (id),
    CONSTRAINT fk_enderecos_cliente FOREIGN KEY (cliente_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enderecos_bairro FOREIGN KEY (bairro_id)
        REFERENCES bairros (id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE INDEX idx_enderecos_cliente
    ON enderecos_clientes (cliente_id, ativo, principal);

CREATE TABLE pedidos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(24) NOT NULL,
    chave_idempotencia VARCHAR(64) NOT NULL,
    cliente_id BIGINT UNSIGNED NOT NULL,
    batedeira_id BIGINT UNSIGNED NOT NULL,
    endereco_cliente_id BIGINT UNSIGNED NULL,
    status ENUM(
        'AGUARDANDO_ACEITE', 'ACEITO', 'AGUARDANDO_PAGAMENTO', 'EM_PREPARO',
        'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'RECUSADO', 'EXPIRADO',
        'CANCELADO', 'FALHA_NA_ENTREGA'
    ) NOT NULL DEFAULT 'AGUARDANDO_ACEITE',
    forma_pagamento ENUM('DINHEIRO', 'PIX') NULL,
    subtotal_centavos INT UNSIGNED NOT NULL,
    taxa_entrega_centavos INT UNSIGNED NOT NULL,
    total_centavos INT UNSIGNED NOT NULL,
    volume_total_ml INT UNSIGNED NOT NULL,
    troco_para_centavos INT UNSIGNED NULL,
    observacao VARCHAR(500) NULL,
    estimativa_minutos_min SMALLINT UNSIGNED NOT NULL,
    estimativa_minutos_max SMALLINT UNSIGNED NOT NULL,
    endereco_snapshot VARCHAR(255) NOT NULL,
    bairro_snapshot VARCHAR(100) NOT NULL,
    referencia_snapshot VARCHAR(255) NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_aceite_em TIMESTAMP NOT NULL,
    aceito_em TIMESTAMP NULL,
    escolha_pagamento_expira_em TIMESTAMP NULL,
    finalizado_em TIMESTAMP NULL,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_pedidos PRIMARY KEY (id),
    CONSTRAINT uq_pedidos_codigo UNIQUE (codigo),
    CONSTRAINT uq_pedidos_cliente_idempotencia UNIQUE (cliente_id, chave_idempotencia),
    CONSTRAINT fk_pedidos_cliente FOREIGN KEY (cliente_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_batedeira FOREIGN KEY (batedeira_id)
        REFERENCES batedeiras (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_endereco FOREIGN KEY (endereco_cliente_id)
        REFERENCES enderecos_clientes (id) ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT ck_pedidos_valores CHECK (
        subtotal_centavos > 0
        AND total_centavos = subtotal_centavos + taxa_entrega_centavos
    ),
    CONSTRAINT ck_pedidos_volume_minimo CHECK (volume_total_ml >= 1000),
    CONSTRAINT ck_pedidos_troco CHECK (
        troco_para_centavos IS NULL
        OR (forma_pagamento = 'DINHEIRO' AND troco_para_centavos >= total_centavos)
    ),
    CONSTRAINT ck_pedidos_estimativa CHECK (
        estimativa_minutos_min > 0
        AND estimativa_minutos_max >= estimativa_minutos_min
    ),
    CONSTRAINT ck_pedidos_expiracao_aceite CHECK (expira_aceite_em > criado_em),
    CONSTRAINT ck_pedidos_forma_pagamento CHECK (
        (status NOT IN ('AGUARDANDO_PAGAMENTO', 'EM_PREPARO', 'PRONTO',
                        'SAIU_PARA_ENTREGA', 'ENTREGUE', 'FALHA_NA_ENTREGA')
         OR forma_pagamento IS NOT NULL)
        AND (status <> 'AGUARDANDO_PAGAMENTO' OR forma_pagamento = 'PIX')
    ),
    CONSTRAINT ck_pedidos_escolha_pagamento CHECK (
        status <> 'ACEITO' OR escolha_pagamento_expira_em IS NOT NULL
    )
) ENGINE = InnoDB;

CREATE INDEX idx_pedidos_cliente_criacao
    ON pedidos (cliente_id, criado_em);
CREATE INDEX idx_pedidos_batedeira_fila
    ON pedidos (batedeira_id, status, criado_em);
CREATE INDEX idx_pedidos_expiracao
    ON pedidos (status, expira_aceite_em);
CREATE INDEX idx_pedidos_expiracao_escolha_pagamento
    ON pedidos (status, escolha_pagamento_expira_em);

CREATE TABLE itens_pedido (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pedido_id BIGINT UNSIGNED NOT NULL,
    produto_id BIGINT UNSIGNED NULL,
    nome_produto_snapshot VARCHAR(150) NOT NULL,
    unidade_snapshot VARCHAR(50) NOT NULL,
    volume_unitario_ml_snapshot SMALLINT UNSIGNED NOT NULL,
    preco_unitario_centavos INT UNSIGNED NOT NULL,
    quantidade SMALLINT UNSIGNED NOT NULL,
    subtotal_centavos INT UNSIGNED NOT NULL,
    observacao VARCHAR(300) NULL,

    CONSTRAINT pk_itens_pedido PRIMARY KEY (id),
    CONSTRAINT fk_itens_pedido_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos (id) ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_itens_pedido_produto FOREIGN KEY (produto_id)
        REFERENCES produtos (id) ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT ck_itens_pedido_volume CHECK (volume_unitario_ml_snapshot > 0),
    CONSTRAINT ck_itens_pedido_quantidade CHECK (quantidade > 0),
    CONSTRAINT ck_itens_pedido_preco CHECK (preco_unitario_centavos > 0),
    CONSTRAINT ck_itens_pedido_subtotal CHECK (
        subtotal_centavos = preco_unitario_centavos * quantidade
    )
) ENGINE = InnoDB;

CREATE INDEX idx_itens_pedido_pedido ON itens_pedido (pedido_id);

CREATE TABLE eventos_pedido (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pedido_id BIGINT UNSIGNED NOT NULL,
    usuario_id BIGINT UNSIGNED NULL,
    origem_processo VARCHAR(100) NULL,
    tipo ENUM(
        'PEDIDO_CRIADO', 'STATUS_ALTERADO', 'PEDIDO_RECUSADO',
        'PEDIDO_CANCELADO', 'MENSAGEM_OPERACIONAL',
        'INTERVENCAO_ADMINISTRATIVA', 'PAGAMENTO_ESCOLHIDO',
        'PAGAMENTO_CONFIRMADO', 'PAGAMENTO_EXPIRADO', 'ESTORNO_REGISTRADO',
        'CONTESTACAO_ABERTA', 'CONTESTACAO_DECIDIDA'
    ) NOT NULL,
    status_anterior ENUM(
        'AGUARDANDO_ACEITE', 'ACEITO', 'AGUARDANDO_PAGAMENTO', 'EM_PREPARO',
        'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'RECUSADO', 'EXPIRADO',
        'CANCELADO', 'FALHA_NA_ENTREGA'
    ) NULL,
    status_novo ENUM(
        'AGUARDANDO_ACEITE', 'ACEITO', 'AGUARDANDO_PAGAMENTO', 'EM_PREPARO',
        'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'RECUSADO', 'EXPIRADO',
        'CANCELADO', 'FALHA_NA_ENTREGA'
    ) NULL,
    motivo VARCHAR(255) NULL,
    mensagem VARCHAR(500) NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_eventos_pedido PRIMARY KEY (id),
    CONSTRAINT fk_eventos_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_eventos_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_eventos_responsavel CHECK (
        (usuario_id IS NOT NULL AND origem_processo IS NULL)
        OR (usuario_id IS NULL AND origem_processo IS NOT NULL)
    ),
    CONSTRAINT ck_eventos_status CHECK (
        tipo <> 'STATUS_ALTERADO' OR status_novo IS NOT NULL
    )
) ENGINE = InnoDB;

CREATE INDEX idx_eventos_pedido_linha_tempo
    ON eventos_pedido (pedido_id, criado_em);

CREATE TABLE pagamentos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pedido_id BIGINT UNSIGNED NOT NULL,
    provedor VARCHAR(30) NOT NULL,
    provedor_pagamento_id VARCHAR(100) NULL,
    status ENUM('PENDENTE', 'CONFIRMADO', 'EXPIRADO', 'ESTORNADO') NOT NULL DEFAULT 'PENDENTE',
    valor_centavos INT UNSIGNED NOT NULL,
    expira_em TIMESTAMP NOT NULL,
    confirmado_em TIMESTAMP NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_pagamentos PRIMARY KEY (id),
    CONSTRAINT uq_pagamentos_pedido UNIQUE (pedido_id),
    CONSTRAINT uq_pagamentos_provedor_id UNIQUE (provedor, provedor_pagamento_id),
    CONSTRAINT fk_pagamentos_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_pagamentos_valor CHECK (valor_centavos > 0),
    CONSTRAINT ck_pagamentos_expiracao CHECK (expira_em > criado_em),
    CONSTRAINT ck_pagamentos_confirmacao CHECK (
        status NOT IN ('CONFIRMADO', 'ESTORNADO') OR confirmado_em IS NOT NULL
    )
) ENGINE = InnoDB;

CREATE INDEX idx_pagamentos_expiracao ON pagamentos (status, expira_em);
CREATE INDEX idx_pagamentos_confirmacao ON pagamentos (confirmado_em);

CREATE TABLE contestacoes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pedido_id BIGINT UNSIGNED NOT NULL,
    cliente_id BIGINT UNSIGNED NOT NULL,
    motivo ENUM(
        'PRODUTO_MAU_ESTADO', 'ENTREGA_NAO_RECEBIDA', 'PEDIDO_DIFERENTE',
        'PIX_SEM_ANDAMENTO_OU_ESTORNO_NAO_REALIZADO', 'VALOR_DIFERENTE'
    ) NOT NULL,
    descricao VARCHAR(500) NULL,
    status ENUM('ABERTA', 'PROCEDENTE', 'IMPROCEDENTE') NOT NULL DEFAULT 'ABERTA',
    responder_ate TIMESTAMP NOT NULL,
    primeira_resposta_em TIMESTAMP NULL,
    decidida_por BIGINT UNSIGNED NULL,
    decidida_em TIMESTAMP NULL,
    decisao VARCHAR(500) NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pedido_aberto_id BIGINT UNSIGNED
        GENERATED ALWAYS AS (IF(status = 'ABERTA', pedido_id, NULL)) STORED,

    CONSTRAINT pk_contestacoes PRIMARY KEY (id),
    CONSTRAINT uq_contestacoes_aberta_por_pedido UNIQUE (pedido_aberto_id),
    CONSTRAINT fk_contestacoes_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_contestacoes_cliente FOREIGN KEY (cliente_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_contestacoes_decisor FOREIGN KEY (decidida_por)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_contestacoes_prazo CHECK (responder_ate > criado_em),
    CONSTRAINT ck_contestacoes_decisao CHECK (
        status = 'ABERTA'
        OR (decidida_por IS NOT NULL AND decidida_em IS NOT NULL AND decisao IS NOT NULL)
    )
) ENGINE = InnoDB;

CREATE INDEX idx_contestacoes_fila ON contestacoes (status, responder_ate);
CREATE INDEX idx_contestacoes_pedido ON contestacoes (pedido_id);

CREATE TABLE estornos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pagamento_id BIGINT UNSIGNED NOT NULL,
    contestacao_id BIGINT UNSIGNED NULL,
    origem ENUM('CANCELAMENTO_PEDIDO', 'FALHA_ENTREGA') NOT NULL,
    valor_centavos INT UNSIGNED NOT NULL,
    prazo_em TIMESTAMP NOT NULL,
    status ENUM('PENDENTE', 'CONCLUIDO', 'FALHOU') NOT NULL DEFAULT 'PENDENTE',
    usuario_id BIGINT UNSIGNED NULL,
    provedor_estorno_id VARCHAR(100) NULL,
    concluido_em TIMESTAMP NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_estornos PRIMARY KEY (id),
    CONSTRAINT fk_estornos_pagamento FOREIGN KEY (pagamento_id)
        REFERENCES pagamentos (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_estornos_contestacao FOREIGN KEY (contestacao_id)
        REFERENCES contestacoes (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_estornos_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_estornos_valor CHECK (valor_centavos > 0),
    CONSTRAINT ck_estornos_conclusao CHECK (
        status <> 'CONCLUIDO' OR (concluido_em IS NOT NULL AND usuario_id IS NOT NULL)
    )
) ENGINE = InnoDB;

CREATE INDEX idx_estornos_pagamento ON estornos (pagamento_id);
CREATE INDEX idx_estornos_prazo ON estornos (status, prazo_em);
CREATE INDEX idx_estornos_conclusao ON estornos (concluido_em);

CREATE TABLE eventos_webhook (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pagamento_id BIGINT UNSIGNED NULL,
    provedor VARCHAR(30) NOT NULL,
    evento_externo_id VARCHAR(100) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    assinatura_valida BOOLEAN NOT NULL,
    recebido_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processado_em TIMESTAMP NULL,

    CONSTRAINT pk_eventos_webhook PRIMARY KEY (id),
    -- A assinatura entra na chave para que um evento forjado com o mesmo identificador
    -- não bloqueie o evento legítimo.
    CONSTRAINT uq_eventos_webhook_evento UNIQUE (provedor, evento_externo_id, assinatura_valida),
    CONSTRAINT fk_eventos_webhook_pagamento FOREIGN KEY (pagamento_id)
        REFERENCES pagamentos (id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE INDEX idx_eventos_webhook_pagamento ON eventos_webhook (pagamento_id, recebido_em);

CREATE TABLE eventos_auditoria (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    acao VARCHAR(100) NOT NULL,
    entidade_tipo VARCHAR(100) NOT NULL,
    entidade_id BIGINT UNSIGNED NOT NULL,
    detalhes JSON NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_eventos_auditoria PRIMARY KEY (id),
    CONSTRAINT fk_eventos_auditoria_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE INDEX idx_eventos_auditoria_entidade
    ON eventos_auditoria (entidade_tipo, entidade_id, criado_em);
CREATE INDEX idx_eventos_auditoria_usuario
    ON eventos_auditoria (usuario_id, criado_em);
