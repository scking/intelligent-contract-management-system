# Contract Management System Production Recovery

## Runtime

- App dir: `/opt/contract-management-system/current`
- Service: `contract-management-system.service`
- Nginx: `nginx`
- Database: `mariadb`
- Backup dir: `/opt/contract-management-system/backups`
- Backup script: `/opt/contract-management-system/scripts/backup_cms.sh`

## Health Checks

```bash
systemctl status contract-management-system.service
systemctl status nginx
systemctl status mariadb
curl -I http://127.0.0.1:3060
curl -I http://127.0.0.1
```

## Manual Backup

```bash
/opt/contract-management-system/scripts/backup_cms.sh
ls -lh /opt/contract-management-system/backups
```

## Restore Database Backup

```bash
LATEST_SQL=$(ls -1t /opt/contract-management-system/backups/db-*.sql.gz | head -n 1)
gunzip -c "$LATEST_SQL" | mysql -ucms_app -p
systemctl restart contract-management-system.service
```

## Restore JSON Snapshot

```bash
LATEST_JSON=$(ls -1t /opt/contract-management-system/backups/dbjson-*.json | head -n 1)
cp "$LATEST_JSON" /opt/contract-management-system/current/data/db.json
systemctl restart contract-management-system.service
```

## Restart Services

```bash
systemctl restart mariadb
systemctl restart contract-management-system.service
systemctl reload nginx
```
