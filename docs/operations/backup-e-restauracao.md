# Backup e restauração do banco — procedimento e evidência

**Estado:** rascunho para revisão. Cobre o backlog 1.6 e o critério de lançamento do PRD §26 ("backup automático com teste de restauração documentado") **apenas no ambiente local**. A mesma verificação precisa ser repetida no banco gerenciado de homologação antes do piloto (ADR-003, ainda proposta).

## O que é protegido

| Dado | Onde fica | Como é protegido |
|---|---|---|
| Banco MySQL (pedidos, usuários, auditoria, catálogo) | MySQL 8 | `mysqldump` consistente, em uma transação, com rotinas, gatilhos e eventos |
| Fotos | Pasta `UPLOADS_DIR` (hoje, só local) | `tar.gz` opcional, no mesmo script |

Os arquivos de backup contêm dados pessoais. O script os cria com permissão 600, a pasta `backups/` é ignorada pelo Git, e eles nunca devem ser versionados nem copiados para fora sem criptografia.

## Como fazer o backup

```sh
cd app
pnpm db:backup [pasta-de-destino]      # padrão: ./backups
```

- Gera `acai_conecta-<data>.sql.gz` e `.sha256`, verifica a integridade do gzip e confere que o dump terminou normalmente.
- Mantém os últimos 14 dias (`RETENCAO_DIAS`); apaga só arquivos com o nome que o próprio script gera.
- `MODO=direto` usa `mysqldump` instalado com `DATABASE_URL`; o padrão `MODO=docker` usa o MySQL do `docker-compose`.
- Inclui as fotos se `UPLOADS_DIR` estiver definido.

**Frequência proposta (a confirmar):** diária. No ambiente gerenciado (ADR-003), o backup diário automático do provedor é o principal, e este script serve como cópia lógica adicional e para o teste de restauração. Objetivos de ponto e de tempo de recuperação não foram definidos pelo responsável e ficam como pendência.

## Como testar a restauração

```sh
pnpm db:testar-restauracao [arquivo.sql.gz]    # padrão: o backup mais recente
```

O script restaura em um banco **temporário** e confere:

1. checksum e integridade do arquivo;
2. mesmas tabelas, restrições `CHECK` e chaves estrangeiras da origem;
3. contagem de linhas por tabela igual à da origem (se houve escrita depois do backup, a diferença é acusada; `PERMITIR_DIFERENCA=1` a aceita de forma explícita);
4. nenhum registro órfão em nenhuma das relações (o dump desliga as chaves estrangeiras durante a carga);
5. `CHECK TABLE` em todas as tabelas.

O banco de origem não é alterado e o temporário é apagado ao final, inclusive em caso de falha. Código de saída 0 só quando tudo confere.

## Restauração de verdade (incidente)

1. Pare a aplicação (ou coloque-a em manutenção) para que nada escreva durante a restauração.
2. Escolha o backup, confira o checksum (`sha256sum -c`) e **restaure primeiro em um banco temporário**, com o teste acima, para ter certeza de que o arquivo é bom.
3. Só então restaure sobre o banco de produção, com autorização explícita do responsável: `gzip -dc arquivo.sql.gz | mysql <banco>`. Isso substitui os dados atuais; antes, faça um backup do estado atual.
4. Restaure as fotos (`tar -xzf fotos-<data>.tar.gz -C "$UPLOADS_DIR"`), suba a aplicação e confira uma tela de cada perfil e um pedido recente.
5. Registre o incidente: causa, backup usado, horário e perda de dados (tudo que foi escrito depois do backup).

## Evidência do teste (ambiente local)

| Item | Resultado |
|---|---|
| Data | 23/11/2026 |
| Ambiente | MySQL 8.0 em contêiner Docker local, dados de desenvolvimento |
| Backup | 8 KB compactado, 1 s; checksum conferido |
| Restauração | menos de 1 s em banco temporário |
| Estrutura | 14 tabelas, 18 restrições `CHECK` e 17 chaves estrangeiras, iguais às da origem |
| Dados | 155 linhas em 14 tabelas, todas iguais às da origem |
| Integridade referencial | 17 relações conferidas, sem órfãos |
| `CHECK TABLE` | 14 tabelas OK |
| Resultado | **restauração verificada, sem divergências** |

Casos negativos verificados: arquivo adulterado é recusado (gzip e checksum); linha inserida depois do backup é acusada como diferença (saída com erro); o banco temporário é sempre removido.

**O que esta evidência não prova:** o tempo de restauração com dados reais, o backup do provedor gerenciado, a restauração entre servidores diferentes, a criptografia e o armazenamento externo das cópias e a recuperação até um ponto no tempo. Isso fica para a homologação.

## Pendências

- Repetir o teste no MySQL gerenciado de homologação e anexar o resultado aqui (depende da ADR-003).
- Definir retenção, local externo e criptografia das cópias, e quem executa e confere o teste periodicamente.
- Definir objetivos de ponto e de tempo de recuperação com o responsável pelo projeto.
- Agendar a execução do backup (no ambiente gerenciado, pelo serviço do provedor).
