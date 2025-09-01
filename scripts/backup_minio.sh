#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR=${1:-backups}
TS=$(date -u +%Y%m%dT%H%M%SZ)
DEST="$BACKUP_DIR/$TS"
mkdir -p "$DEST"

# Backup dos dados locais do pygeoapi
cp -a infra/pygeoapi/localdata "$DEST/pygeoapi_localdata"

# Placeholder: backups MinIO requerem mc (MinIO client) configurado
# if command -v mc >/dev/null 2>&1; then
#   mc alias set local $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
#   mc cp --recursive local/biomassa "$DEST/minio_biomassa"
#   mc cp --recursive local/stac-assets "$DEST/minio_stac_assets"
# fi

echo "Backup concluído em $DEST"
