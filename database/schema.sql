-- AçaíConecta
-- Schema inicial do MVP reduzido para MySQL 8+
-- Versão: 0.4
-- Atualização: setembro de 2026
--
-- Convenções:
--   - identificadores BIGINT AUTO_INCREMENT;
--   - valores monetários em centavos e volumes em mililitros;
--   - somente entrega, com pedido mínimo total de 1 litro;
--   - dinheiro ou Pix na entrega, sem processamento financeiro pela plataforma;
--   - bairros canônicos e taxa de entrega explícita;
--   - um operador responsável por batedeira durante o piloto.
--   - dias da semana numerados de 0 (domingo) a 6 (sábado).
--
-- Invariantes que deverão ser validadas também pela aplicação:
--   - responsavel_id referencia um usuário do tipo BATEDEIRA;
--   - cliente_id referencia um usuário do tipo CLIENTE;
--   - usuario_id de ações administrativas referencia um ADMINISTRADOR;
--   - estados de pedido seguem exclusivamente as transições definidas no PRD;
--   - subtotal, volume e snapshots do pedido são calculados em uma transação única.

CREATE DATABASE IF NOT EXISTS acai_conecta
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE acai_conecta;

CREATE TABLE usuarios (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo ENUM('CLIENTE', 'BATEDEIRA', 'ADMINISTRADOR') NOT NULL,
    status ENUM('ATIVO', 'BLOQUEADO', 'DESATIVADO') NOT NULL DEFAULT 'ATIVO',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE = InnoDB;

CREATE TABLE bairros (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
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
    status ENUM('EM_ANALISE', 'ATIVA', 'SUSPENSA', 'DESATIVADA') NOT NULL DEFAULT 'EM_ANALISE',
    aberta BOOLEAN NOT NULL DEFAULT FALSE,
    entrega_disponivel BOOLEAN NOT NULL DEFAULT FALSE,
    estimativa_minutos_min SMALLINT UNSIGNED NOT NULL,
    estimativa_minutos_max SMALLINT UNSIGNED NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_batedeiras PRIMARY KEY (id),
    CONSTRAINT uq_batedeiras_responsavel UNIQUE (responsavel_id),
    CONSTRAINT fk_batedeiras_responsavel FOREIGN KEY (responsavel_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_batedeiras_bairro FOREIGN KEY (bairro_id)
        REFERENCES bairros (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_batedeiras_estimativa CHECK (
        estimativa_minutos_min > 0
        AND estimativa_minutos_max >= estimativa_minutos_min
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
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_batedeiras_bairros PRIMARY KEY (id),
    CONSTRAINT uq_batedeiras_bairros UNIQUE (batedeira_id, bairro_id),
    CONSTRAINT fk_batedeiras_bairros_batedeira FOREIGN KEY (batedeira_id)
        REFERENCES batedeiras (id) ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_batedeiras_bairros_bairro FOREIGN KEY (bairro_id)
        REFERENCES bairros (id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE INDEX idx_batedeiras_bairros_busca
    ON batedeiras_bairros (bairro_id, ativo);

CREATE TABLE produtos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    batedeira_id BIGINT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao VARCHAR(500) NULL,
    tipo ENUM('GROSSO', 'FINO', 'OUTRO') NULL,
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
        'AGUARDANDO_ACEITE', 'ACEITO', 'EM_PREPARO', 'PRONTO',
        'SAIU_PARA_ENTREGA', 'ENTREGUE', 'RECUSADO', 'EXPIRADO',
        'CANCELADO', 'FALHA_NA_ENTREGA'
    ) NOT NULL DEFAULT 'AGUARDANDO_ACEITE',
    forma_pagamento ENUM('DINHEIRO', 'PIX_NA_ENTREGA') NOT NULL,
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
    CONSTRAINT ck_pedidos_expiracao_aceite CHECK (expira_aceite_em > criado_em)
) ENGINE = InnoDB;

CREATE INDEX idx_pedidos_cliente_criacao
    ON pedidos (cliente_id, criado_em);
CREATE INDEX idx_pedidos_batedeira_fila
    ON pedidos (batedeira_id, status, criado_em);
CREATE INDEX idx_pedidos_expiracao
    ON pedidos (status, expira_aceite_em);

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
        'INTERVENCAO_ADMINISTRATIVA'
    ) NOT NULL,
    status_anterior ENUM(
        'AGUARDANDO_ACEITE', 'ACEITO', 'EM_PREPARO', 'PRONTO',
        'SAIU_PARA_ENTREGA', 'ENTREGUE', 'RECUSADO', 'EXPIRADO',
        'CANCELADO', 'FALHA_NA_ENTREGA'
    ) NULL,
    status_novo ENUM(
        'AGUARDANDO_ACEITE', 'ACEITO', 'EM_PREPARO', 'PRONTO',
        'SAIU_PARA_ENTREGA', 'ENTREGUE', 'RECUSADO', 'EXPIRADO',
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
