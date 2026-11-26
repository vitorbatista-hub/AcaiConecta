CREATE TABLE redefinicoes_senha (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em TIMESTAMP NOT NULL,
    usada_em TIMESTAMP NULL,

    CONSTRAINT pk_redefinicoes_senha PRIMARY KEY (id),
    CONSTRAINT uq_redefinicoes_senha_token UNIQUE (token_hash),
    CONSTRAINT fk_redefinicoes_senha_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT ck_redefinicoes_senha_expiracao CHECK (expira_em > criado_em)
) ENGINE = InnoDB;

CREATE INDEX idx_redefinicoes_senha_usuario
    ON redefinicoes_senha (usuario_id, usada_em, expira_em);
