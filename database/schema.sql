-- AçaíConecta
-- Schema inicial do MVP para MySQL 8+
-- Versão: 0.2
-- Atualização: setembro de 2026
--
-- Convenções:
--   - identificadores BIGINT AUTO_INCREMENT;
--   - valores monetários em centavos e volumes em mililitros;
--   - somente entrega, com pedido mínimo total de 1 litro;
--   - dinheiro na entrega ou Pix on-line após o aceite;
--   - no máximo duas cobranças Pix por pedido;
--   - arquivos privados referenciados por chave, não armazenados no banco.

CREATE DATABASE IF NOT EXISTS acai_conecta
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE acai_conecta;

CREATE TABLE usuarios (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    cpf CHAR(11) NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo ENUM('CLIENTE', 'BATEDEIRA', 'ADMINISTRADOR') NOT NULL,
    status ENUM('PENDENTE', 'ATIVO', 'BLOQUEADO', 'DESATIVADO') NOT NULL DEFAULT 'PENDENTE',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT uq_usuarios_cpf UNIQUE (cpf),
    CONSTRAINT ck_usuarios_cpf CHECK (cpf IS NULL OR CHAR_LENGTH(cpf) = 11)
) ENGINE = InnoDB;

CREATE TABLE batedeiras (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    responsavel_id BIGINT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao VARCHAR(500) NULL,
    cnpj CHAR(14) NULL,
    telefone_operacional VARCHAR(20) NULL,
    imagem_url VARCHAR(2048) NULL,
    endereco VARCHAR(255) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
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
    CONSTRAINT uq_batedeiras_cnpj UNIQUE (cnpj),
    CONSTRAINT fk_batedeiras_responsavel FOREIGN KEY (responsavel_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_batedeiras_cnpj CHECK (cnpj IS NULL OR CHAR_LENGTH(cnpj) = 14),
    CONSTRAINT ck_batedeiras_estimativa CHECK (
        estimativa_minutos_min > 0
        AND estimativa_minutos_max >= estimativa_minutos_min
    )
) ENGINE = InnoDB;

CREATE INDEX idx_batedeiras_status_disponibilidade
    ON batedeiras (status, aberta, entrega_disponivel);
CREATE INDEX idx_batedeiras_bairro ON batedeiras (bairro);

CREATE TABLE documentos_batedeira (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    batedeira_id BIGINT UNSIGNED NOT NULL,
    tipo ENUM('ALVARA_FUNCIONAMENTO', 'LICENCA_SANITARIA', 'OUTRO') NOT NULL,
    numero VARCHAR(100) NULL,
    arquivo_chave VARCHAR(512) NOT NULL,
    status ENUM('PENDENTE', 'APROVADO', 'REJEITADO', 'EXPIRADO') NOT NULL DEFAULT 'PENDENTE',
    emitido_em DATE NULL,
    valido_ate DATE NULL,
    analisado_por_id BIGINT UNSIGNED NULL,
    motivo_rejeicao VARCHAR(500) NULL,
    analisado_em TIMESTAMP NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_documentos_batedeira PRIMARY KEY (id),
    CONSTRAINT fk_documentos_batedeira FOREIGN KEY (batedeira_id)
        REFERENCES batedeiras (id) ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_documentos_analisado_por FOREIGN KEY (analisado_por_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT ck_documentos_validade CHECK (
        valido_ate IS NULL OR emitido_em IS NULL OR valido_ate >= emitido_em
    ),
    CONSTRAINT ck_documentos_rejeicao CHECK (
        status <> 'REJEITADO' OR motivo_rejeicao IS NOT NULL
    )
) ENGINE = InnoDB;

CREATE INDEX idx_documentos_batedeira_status
    ON documentos_batedeira (batedeira_id, tipo, status);

CREATE TABLE contas_recebimento (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    batedeira_id BIGINT UNSIGNED NOT NULL,
    provedor VARCHAR(50) NOT NULL,
    recebedor_externo_id VARCHAR(191) NOT NULL,
    status ENUM('PENDENTE', 'ATIVA', 'RESTRITA', 'DESCONECTADA') NOT NULL DEFAULT 'PENDENTE',
    conectada_em TIMESTAMP NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_contas_recebimento PRIMARY KEY (id),
    CONSTRAINT uq_contas_recebimento_batedeira_provedor UNIQUE (batedeira_id, provedor),
    CONSTRAINT uq_contas_recebimento_provedor_recebedor UNIQUE (provedor, recebedor_externo_id),
    CONSTRAINT fk_contas_recebimento_batedeira FOREIGN KEY (batedeira_id)
        REFERENCES batedeiras (id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE INDEX idx_contas_recebimento_status
    ON contas_recebimento (batedeira_id, status);

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
    bairro VARCHAR(100) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_batedeiras_bairros PRIMARY KEY (id),
    CONSTRAINT uq_batedeiras_bairros UNIQUE (batedeira_id, bairro),
    CONSTRAINT fk_batedeiras_bairros_batedeira FOREIGN KEY (batedeira_id)
        REFERENCES batedeiras (id) ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE INDEX idx_batedeiras_bairros_busca
    ON batedeiras_bairros (bairro, ativo);

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
    bairro VARCHAR(100) NOT NULL,
    ponto_referencia VARCHAR(255) NULL,
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_enderecos_clientes PRIMARY KEY (id),
    CONSTRAINT fk_enderecos_cliente FOREIGN KEY (cliente_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE INDEX idx_enderecos_cliente
    ON enderecos_clientes (cliente_id, ativo, principal);

CREATE TABLE pedidos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(24) NOT NULL,
    cliente_id BIGINT UNSIGNED NOT NULL,
    batedeira_id BIGINT UNSIGNED NOT NULL,
    endereco_cliente_id BIGINT UNSIGNED NULL,
    status ENUM(
        'AGUARDANDO_ACEITE', 'ACEITO', 'AGUARDANDO_PAGAMENTO',
        'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE',
        'RECUSADO', 'EXPIRADO', 'CANCELADO', 'FALHA_NA_ENTREGA'
    ) NOT NULL DEFAULT 'AGUARDANDO_ACEITE',
    forma_pagamento ENUM('DINHEIRO', 'PIX_ONLINE') NOT NULL,
    status_pagamento ENUM(
        'NAO_APLICAVEL', 'PENDENTE', 'PAGO',
        'DEVOLUCAO_PENDENTE', 'DEVOLVIDO'
    ) NOT NULL,
    subtotal_centavos INT UNSIGNED NOT NULL,
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
    aceito_em TIMESTAMP NULL,
    finalizado_em TIMESTAMP NULL,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_pedidos PRIMARY KEY (id),
    CONSTRAINT uq_pedidos_codigo UNIQUE (codigo),
    CONSTRAINT fk_pedidos_cliente FOREIGN KEY (cliente_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_batedeira FOREIGN KEY (batedeira_id)
        REFERENCES batedeiras (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_endereco FOREIGN KEY (endereco_cliente_id)
        REFERENCES enderecos_clientes (id) ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT ck_pedidos_valores CHECK (
        subtotal_centavos >= 0 AND total_centavos >= subtotal_centavos
    ),
    CONSTRAINT ck_pedidos_volume_minimo CHECK (volume_total_ml >= 1000),
    CONSTRAINT ck_pedidos_troco CHECK (
        troco_para_centavos IS NULL OR forma_pagamento = 'DINHEIRO'
    ),
    CONSTRAINT ck_pedidos_status_pagamento CHECK (
        (forma_pagamento = 'DINHEIRO' AND status_pagamento = 'NAO_APLICAVEL')
        OR
        (forma_pagamento = 'PIX_ONLINE' AND status_pagamento <> 'NAO_APLICAVEL')
    ),
    CONSTRAINT ck_pedidos_estimativa CHECK (
        estimativa_minutos_min > 0
        AND estimativa_minutos_max >= estimativa_minutos_min
    )
) ENGINE = InnoDB;

CREATE INDEX idx_pedidos_cliente_criacao
    ON pedidos (cliente_id, criado_em);
CREATE INDEX idx_pedidos_batedeira_fila
    ON pedidos (batedeira_id, status, criado_em);

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

CREATE TABLE cobrancas_pix (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pedido_id BIGINT UNSIGNED NOT NULL,
    conta_recebimento_id BIGINT UNSIGNED NOT NULL,
    tentativa TINYINT UNSIGNED NOT NULL,
    cobranca_externa_id VARCHAR(191) NOT NULL,
    status ENUM('PENDENTE', 'PAGA', 'EXPIRADA', 'CANCELADA', 'DEVOLVIDA', 'ERRO')
        NOT NULL DEFAULT 'PENDENTE',
    valor_centavos INT UNSIGNED NOT NULL,
    pix_copia_cola TEXT NULL,
    qr_code_url VARCHAR(2048) NULL,
    expira_em TIMESTAMP NOT NULL,
    pago_em TIMESTAMP NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_cobrancas_pix PRIMARY KEY (id),
    CONSTRAINT uq_cobrancas_pix_pedido_tentativa UNIQUE (pedido_id, tentativa),
    CONSTRAINT uq_cobrancas_pix_externa UNIQUE (cobranca_externa_id),
    CONSTRAINT fk_cobrancas_pix_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_cobrancas_pix_conta FOREIGN KEY (conta_recebimento_id)
        REFERENCES contas_recebimento (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_cobrancas_pix_tentativa CHECK (tentativa BETWEEN 1 AND 2),
    CONSTRAINT ck_cobrancas_pix_valor CHECK (valor_centavos > 0),
    CONSTRAINT ck_cobrancas_pix_expiracao CHECK (expira_em > criado_em)
) ENGINE = InnoDB;

CREATE INDEX idx_cobrancas_pix_pedido_status
    ON cobrancas_pix (pedido_id, status);
CREATE INDEX idx_cobrancas_pix_expiracao
    ON cobrancas_pix (status, expira_em);

CREATE TABLE devolucoes_pix (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cobranca_pix_id BIGINT UNSIGNED NOT NULL,
    solicitada_por_id BIGINT UNSIGNED NULL,
    devolucao_externa_id VARCHAR(191) NULL,
    status ENUM('SOLICITADA', 'PROCESSANDO', 'CONCLUIDA', 'FALHOU')
        NOT NULL DEFAULT 'SOLICITADA',
    motivo VARCHAR(500) NOT NULL,
    valor_centavos INT UNSIGNED NOT NULL,
    solicitada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concluida_em TIMESTAMP NULL,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_devolucoes_pix PRIMARY KEY (id),
    CONSTRAINT uq_devolucoes_pix_cobranca UNIQUE (cobranca_pix_id),
    CONSTRAINT uq_devolucoes_pix_externa UNIQUE (devolucao_externa_id),
    CONSTRAINT fk_devolucoes_pix_cobranca FOREIGN KEY (cobranca_pix_id)
        REFERENCES cobrancas_pix (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_devolucoes_pix_solicitada_por FOREIGN KEY (solicitada_por_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT ck_devolucoes_pix_valor CHECK (valor_centavos > 0)
) ENGINE = InnoDB;

CREATE INDEX idx_devolucoes_pix_status
    ON devolucoes_pix (status, solicitada_em);

CREATE TABLE evidencias_entrega (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pedido_id BIGINT UNSIGNED NOT NULL,
    registrada_por_id BIGINT UNSIGNED NULL,
    responsavel_entrega VARCHAR(150) NOT NULL,
    arquivo_chave VARCHAR(512) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    tamanho_bytes INT UNSIGNED NOT NULL,
    capturada_em TIMESTAMP NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_evidencias_entrega PRIMARY KEY (id),
    CONSTRAINT uq_evidencias_entrega_pedido UNIQUE (pedido_id),
    CONSTRAINT fk_evidencias_entrega_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_evidencias_entrega_registrada_por FOREIGN KEY (registrada_por_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT ck_evidencias_entrega_tamanho CHECK (tamanho_bytes > 0)
) ENGINE = InnoDB;

CREATE TABLE contestacoes_entrega (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pedido_id BIGINT UNSIGNED NOT NULL,
    cliente_id BIGINT UNSIGNED NOT NULL,
    decidida_por_id BIGINT UNSIGNED NULL,
    status ENUM('ABERTA', 'PROCEDENTE', 'IMPROCEDENTE') NOT NULL DEFAULT 'ABERTA',
    motivo VARCHAR(255) NOT NULL,
    descricao VARCHAR(1000) NULL,
    resolucao VARCHAR(1000) NULL,
    aberta_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decidida_em TIMESTAMP NULL,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_contestacoes_entrega PRIMARY KEY (id),
    CONSTRAINT uq_contestacoes_entrega_pedido UNIQUE (pedido_id),
    CONSTRAINT fk_contestacoes_entrega_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_contestacoes_entrega_cliente FOREIGN KEY (cliente_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_contestacoes_entrega_decidida_por FOREIGN KEY (decidida_por_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT ck_contestacoes_entrega_decisao CHECK (
        (status = 'ABERTA' AND decidida_por_id IS NULL AND decidida_em IS NULL)
        OR
        (status IN ('PROCEDENTE', 'IMPROCEDENTE')
            AND decidida_por_id IS NOT NULL
            AND decidida_em IS NOT NULL
            AND resolucao IS NOT NULL)
    )
) ENGINE = InnoDB;

CREATE INDEX idx_contestacoes_entrega_status
    ON contestacoes_entrega (status, aberta_em);

CREATE TABLE eventos_webhook (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    provedor VARCHAR(50) NOT NULL,
    evento_externo_id VARCHAR(191) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    status ENUM('RECEBIDO', 'PROCESSADO', 'IGNORADO', 'FALHOU') NOT NULL DEFAULT 'RECEBIDO',
    payload JSON NOT NULL,
    tentativas SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    recebido_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processado_em TIMESTAMP NULL,
    erro VARCHAR(1000) NULL,

    CONSTRAINT pk_eventos_webhook PRIMARY KEY (id),
    CONSTRAINT uq_eventos_webhook_provedor_evento UNIQUE (provedor, evento_externo_id)
) ENGINE = InnoDB;

CREATE INDEX idx_eventos_webhook_processamento
    ON eventos_webhook (status, recebido_em);

CREATE TABLE eventos_pedido (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pedido_id BIGINT UNSIGNED NOT NULL,
    usuario_id BIGINT UNSIGNED NULL,
    tipo ENUM(
        'PEDIDO_CRIADO', 'STATUS_ALTERADO', 'PEDIDO_RECUSADO',
        'PEDIDO_CANCELADO', 'MENSAGEM_OPERACIONAL',
        'PAGAMENTO_ATUALIZADO', 'CONTESTACAO_ATUALIZADA',
        'INTERVENCAO_ADMINISTRATIVA'
    ) NOT NULL,
    status_anterior ENUM(
        'AGUARDANDO_ACEITE', 'ACEITO', 'AGUARDANDO_PAGAMENTO',
        'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE',
        'RECUSADO', 'EXPIRADO', 'CANCELADO', 'FALHA_NA_ENTREGA'
    ) NULL,
    status_novo ENUM(
        'AGUARDANDO_ACEITE', 'ACEITO', 'AGUARDANDO_PAGAMENTO',
        'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE',
        'RECUSADO', 'EXPIRADO', 'CANCELADO', 'FALHA_NA_ENTREGA'
    ) NULL,
    motivo VARCHAR(255) NULL,
    mensagem VARCHAR(500) NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_eventos_pedido PRIMARY KEY (id),
    CONSTRAINT fk_eventos_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos (id) ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_eventos_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE SET NULL,
    CONSTRAINT ck_eventos_status CHECK (
        tipo <> 'STATUS_ALTERADO' OR status_novo IS NOT NULL
    )
) ENGINE = InnoDB;

CREATE INDEX idx_eventos_pedido_linha_tempo
    ON eventos_pedido (pedido_id, criado_em);
