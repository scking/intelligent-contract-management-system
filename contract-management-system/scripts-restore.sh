#!/bin/bash
set -euo pipefail
BACKUP_DIR=/opt/contract-management-system/backups
APP_DIR=/opt/contract-management-system/current
LATEST_SQL=$(ls -1t "$BACKUP_DIR"/db-*.sql.gz | head -n 1)
LATEST_JSON=$(ls -1t "$BACKUP_DIR"/dbjson-*.json | head -n 1)

echo "Using SQL backup: $LATEST_SQL"
echo "Using JSON backup: $LATEST_JSON"

gunzip -c "$LATEST_SQL" | mysql -uroot
cp "$LATEST_JSON" "$APP_DIR/data/db.json"
systemctl restart mariadb
systemctl restart contract-management-system.service
systemctl reload nginx

echo "Restore finished."
