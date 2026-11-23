# Funções comuns aos scripts de backup e de teste de restauração. Não executar diretamente.
#
# MODO=docker (padrão): usa o MySQL do docker-compose local, como root do contêiner.
# MODO=direto: usa os clientes mysql/mysqldump instalados, com:
#   DATABASE_URL  mysql://usuario:senha@host:porta/banco   (backup; o usuário precisa de SELECT, LOCK TABLES, SHOW VIEW, TRIGGER, EVENT)
#   ADMIN_URL     mysql://usuario:senha@host:porta          (teste de restauração; precisa criar e apagar um banco temporário)
# A senha vai para o cliente por MYSQL_PWD, nunca na linha de comando, e nenhum script a imprime.

MODO="${MODO:-docker}"
BANCO="${BANCO:-acai_conecta}"

erro() { echo "ERRO: $*" >&2; exit 1; }

# Separa mysql://usuario:senha@host:porta/resto em variáveis com o prefixo dado.
analisar_url() {
  local url="$1" prefixo="$2"
  [[ "$url" =~ ^mysql://([^:]+):([^@]*)@([^:/]+):([0-9]+)(/([^?]*))?$ ]] || erro "URL do MySQL em formato inesperado (${prefixo})."
  printf -v "${prefixo}_USUARIO" '%s' "${BASH_REMATCH[1]}"
  printf -v "${prefixo}_SENHA" '%s' "${BASH_REMATCH[2]}"
  printf -v "${prefixo}_HOST" '%s' "${BASH_REMATCH[3]}"
  printf -v "${prefixo}_PORTA" '%s' "${BASH_REMATCH[4]}"
  printf -v "${prefixo}_BANCO" '%s' "${BASH_REMATCH[6]:-}"
}

# mysql/mysqldump como administrador (root no contêiner local ou ADMIN_URL).
cliente_admin() {
  local ferramenta="$1"; shift
  if [ "$MODO" = docker ]; then
    docker compose exec -T -e MYSQL_PWD="${MYSQL_ROOT_PASSWORD:-dev_root_local}" db "$ferramenta" -uroot "$@"
  else
    [ -n "${ADMIN_URL:-}" ] || erro "defina ADMIN_URL no modo direto."
    analisar_url "$ADMIN_URL" ADM
    MYSQL_PWD="$ADM_SENHA" "$ferramenta" -h"$ADM_HOST" -P"$ADM_PORTA" -u"$ADM_USUARIO" "$@"
  fi
}

# mysqldump com as credenciais do aplicativo (modo direto) ou root (docker).
dump() {
  local opcoes=(--single-transaction --routines --triggers --events --hex-blob --no-tablespaces --set-gtid-purged=OFF --default-character-set=utf8mb4)
  if [ "$MODO" = docker ]; then
    cliente_admin mysqldump "${opcoes[@]}" "$BANCO"
  else
    [ -n "${DATABASE_URL:-}" ] || erro "defina DATABASE_URL no modo direto."
    analisar_url "$DATABASE_URL" APP
    MYSQL_PWD="$APP_SENHA" mysqldump -h"$APP_HOST" -P"$APP_PORTA" -u"$APP_USUARIO" "${opcoes[@]}" "${APP_BANCO:-$BANCO}"
  fi
}

[ "$MODO" = docker ] || [ "$MODO" = direto ] || erro "MODO deve ser docker ou direto."
