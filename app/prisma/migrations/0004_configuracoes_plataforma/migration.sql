CREATE TABLE configuracoes_plataforma (
    id TINYINT UNSIGNED NOT NULL,
    email_suporte VARCHAR(254) NULL,
    atualizado_por BIGINT UNSIGNED NOT NULL,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_configuracoes_plataforma PRIMARY KEY (id),
    CONSTRAINT fk_configuracoes_usuario FOREIGN KEY (atualizado_por)
        REFERENCES usuarios (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_configuracoes_linha_unica CHECK (id = 1)
) ENGINE = InnoDB;
