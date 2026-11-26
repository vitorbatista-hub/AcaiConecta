ALTER TABLE pedidos
    ADD COLUMN telefone_snapshot VARCHAR(20) NOT NULL AFTER referencia_snapshot;
