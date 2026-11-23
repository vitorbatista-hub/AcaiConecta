#!/usr/bin/env bash
# Backup lógico do banco (mysqldump consistente, em uma transação), com verificação de integridade do arquivo,
# checksum SHA-256 e retenção. Opcionalmente inclui as fotos (UPLOADS_DIR).
#
# Uso:  scripts/backup-banco.sh [pasta-de-destino]        (padrão: ./backups, ignorada pelo Git)
# Variáveis: MODO, RETENCAO_DIAS (14), UPLOADS_DIR, BANCO. Veja scripts/_comum.sh.
#
# O arquivo contém dados pessoais: fica com permissão 600 e nunca deve ser versionado nem enviado a lugar sem criptografia.
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=scripts/_comum.sh
source scripts/_comum.sh

DESTINO="${1:-${BACKUP_DIR:-./backups}}"
RETENCAO_DIAS="${RETENCAO_DIAS:-14}"
[[ "$RETENCAO_DIAS" =~ ^[0-9]+$ ]] || erro "RETENCAO_DIAS deve ser um número."
umask 077
mkdir -p "$DESTINO"

CARIMBO="$(date -u +%Y%m%dT%H%M%SZ)"
ARQUIVO="$DESTINO/${BANCO}-${CARIMBO}.sql.gz"
INICIO=$SECONDS

dump | gzip -9 > "${ARQUIVO}.parcial"
gzip -t "${ARQUIVO}.parcial" || { rm -f "${ARQUIVO}.parcial"; erro "arquivo de backup corrompido."; }
# Um dump completo termina com esta linha; sua ausência indica corte no meio.
gzip -dc "${ARQUIVO}.parcial" | tail -n 3 | grep -q "Dump completed" || { rm -f "${ARQUIVO}.parcial"; erro "o dump não terminou normalmente."; }
mv "${ARQUIVO}.parcial" "$ARQUIVO"
( cd "$DESTINO" && sha256sum "$(basename "$ARQUIVO")" > "$(basename "$ARQUIVO").sha256" )
echo "Backup do banco: $ARQUIVO ($(du -h "$ARQUIVO" | cut -f1), $((SECONDS - INICIO)) s)"

if [ -n "${UPLOADS_DIR:-}" ] && [ -d "$UPLOADS_DIR" ]; then
  FOTOS="$DESTINO/fotos-${CARIMBO}.tar.gz"
  tar -czf "$FOTOS" -C "$UPLOADS_DIR" .
  echo "Backup das fotos: $FOTOS ($(du -h "$FOTOS" | cut -f1))"
fi

# Retenção: só apaga arquivos com o nome gerado por este script e mais antigos que o limite.
find "$DESTINO" -maxdepth 1 -type f \( -name "${BANCO}-*.sql.gz" -o -name "${BANCO}-*.sql.gz.sha256" -o -name 'fotos-*.tar.gz' \) -mtime "+${RETENCAO_DIAS}" -delete
echo "Retenção: arquivos com mais de ${RETENCAO_DIAS} dias removidos."
