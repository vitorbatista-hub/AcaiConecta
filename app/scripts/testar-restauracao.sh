#!/usr/bin/env bash
# Teste de restauração (backlog 1.6, PRD §26): restaura um backup em um banco TEMPORÁRIO e confere se os dados voltaram
# íntegros, comparando com o banco de origem. O banco de origem não é alterado e o temporário é apagado ao final.
#
# Uso:  scripts/testar-restauracao.sh [arquivo-de-backup.sql.gz]   (padrão: o mais recente em ./backups)
# Variáveis: MODO, BANCO, BACKUP_DIR, PERMITIR_DIFERENCA=1 (aceita contagens diferentes quando houve escrita depois do backup).
# Saída: relatório em texto; código 0 só se tudo conferir.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=scripts/_comum.sh
source scripts/_comum.sh

DESTINO="${BACKUP_DIR:-./backups}"
ARQUIVO="${1:-$(ls -1t "$DESTINO"/"${BANCO}"-*.sql.gz 2>/dev/null | head -n 1 || true)}"
[ -n "$ARQUIVO" ] && [ -f "$ARQUIVO" ] || erro "nenhum backup encontrado. Rode scripts/backup-banco.sh antes."

if [ -f "${ARQUIVO}.sha256" ]; then
  ( cd "$(dirname "$ARQUIVO")" && sha256sum -c "$(basename "$ARQUIVO").sha256" >/dev/null ) || erro "o checksum do backup não confere."
  CHECKSUM="conferido"
else
  CHECKSUM="sem arquivo .sha256"
fi
gzip -t "$ARQUIVO" || erro "o arquivo de backup está corrompido."

TEMP="${BANCO}_restore_$(date +%s)"
[[ "$TEMP" =~ ^[a-z0-9_]+$ ]] || erro "nome de banco temporário inválido."
limpar() { cliente_admin mysql -e "DROP DATABASE IF EXISTS \`$TEMP\`" </dev/null >/dev/null 2>&1 || true; }
trap limpar EXIT

cliente_admin mysql -e "CREATE DATABASE \`$TEMP\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci" </dev/null
INICIO=$SECONDS
gzip -dc "$ARQUIVO" | cliente_admin mysql "$TEMP"
DURACAO=$((SECONDS - INICIO))

consulta() { cliente_admin mysql -N -B -e "$1" </dev/null; }
FALHAS=0
falhar() { echo "  ✖ $*"; FALHAS=$((FALHAS + 1)); }
passou() { echo "  ✔ $*"; }

echo "Teste de restauração — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Arquivo: $(basename "$ARQUIVO") ($(du -h "$ARQUIVO" | cut -f1)); checksum: $CHECKSUM"
echo "Restauração em banco temporário concluída em ${DURACAO} s."

# 1) Estrutura: mesmas tabelas e restrições CHECK.
T_ORIGEM=$(consulta "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$BANCO' AND TABLE_TYPE='BASE TABLE'")
T_REST=$(consulta "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$TEMP' AND TABLE_TYPE='BASE TABLE'")
[ "$T_ORIGEM" = "$T_REST" ] && [ "$T_REST" -gt 0 ] && passou "tabelas: $T_REST (origem: $T_ORIGEM)" || falhar "tabelas: restauradas $T_REST, origem $T_ORIGEM"
C_ORIGEM=$(consulta "SELECT COUNT(*) FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA='$BANCO'")
C_REST=$(consulta "SELECT COUNT(*) FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA='$TEMP'")
[ "$C_ORIGEM" = "$C_REST" ] && passou "restrições CHECK: $C_REST" || falhar "restrições CHECK: restauradas $C_REST, origem $C_ORIGEM"
F_ORIGEM=$(consulta "SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA='$BANCO'")
F_REST=$(consulta "SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA='$TEMP'")
[ "$F_ORIGEM" = "$F_REST" ] && passou "chaves estrangeiras: $F_REST" || falhar "chaves estrangeiras: restauradas $F_REST, origem $F_ORIGEM"

# 2) Dados: contagem de linhas por tabela, restaurado x origem.
mapfile -t TABELAS < <(consulta "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='$TEMP' AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME")
TOTAL=0
echo "  Linhas por tabela (restaurado / origem):"
for t in "${TABELAS[@]}"; do
  [[ "$t" =~ ^[A-Za-z0-9_]+$ ]] || { falhar "nome de tabela inesperado"; continue; }
  R=$(consulta "SELECT COUNT(*) FROM \`$TEMP\`.\`$t\`")
  O=$(consulta "SELECT COUNT(*) FROM \`$BANCO\`.\`$t\`" 2>/dev/null || echo "?")
  TOTAL=$((TOTAL + R))
  if [ "$R" = "$O" ]; then printf '    %-26s %6s / %s\n' "$t" "$R" "$O"
  elif [ "${PERMITIR_DIFERENCA:-0}" = 1 ]; then printf '    %-26s %6s / %s  (diferença aceita: houve escrita depois do backup)\n' "$t" "$R" "$O"
  else printf '    %-26s %6s / %s  ✖\n' "$t" "$R" "$O"; FALHAS=$((FALHAS + 1)); fi
done
[ "$TOTAL" -gt 0 ] && passou "$TOTAL linhas restauradas no total" || falhar "nenhuma linha restaurada"

# 3) Integridade referencial: nenhum registro filho sem pai (o dump desliga as chaves estrangeiras durante a carga).
mapfile -t FKS < <(consulta "SELECT CONCAT_WS('|', TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME) FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='$TEMP' AND REFERENCED_TABLE_NAME IS NOT NULL")
ORFAOS=0
for fk in "${FKS[@]}"; do
  IFS='|' read -r tf cf tp cp <<<"$fk"
  N=$(consulta "SELECT COUNT(*) FROM \`$TEMP\`.\`$tf\` f LEFT JOIN \`$TEMP\`.\`$tp\` p ON f.\`$cf\` = p.\`$cp\` WHERE f.\`$cf\` IS NOT NULL AND p.\`$cp\` IS NULL")
  [ "$N" = 0 ] || { falhar "registros órfãos em $tf.$cf → $tp: $N"; ORFAOS=$((ORFAOS + N)); }
done
[ "$ORFAOS" = 0 ] && passou "integridade referencial: ${#FKS[@]} relações conferidas, sem órfãos"

# 4) Checagem física das tabelas restauradas.
for t in "${TABELAS[@]}"; do
  S=$(consulta "CHECK TABLE \`$TEMP\`.\`$t\`" | awk -F'\t' '{print $4}' | tail -n 1)
  [ "$S" = "OK" ] || falhar "CHECK TABLE $t: $S"
done
[ "$FALHAS" = 0 ] && passou "CHECK TABLE: ${#TABELAS[@]} tabelas OK"

echo
if [ "$FALHAS" = 0 ]; then echo "RESULTADO: restauração verificada, sem divergências."; else echo "RESULTADO: $FALHAS verificação(ões) falharam."; exit 1; fi
