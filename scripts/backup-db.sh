#!/bin/bash
set -e

# Backup script for PostgreSQL database

# Configuration
DB_URL=${DATABASE_URL:-"postgres://postgres:password@localhost:5432/sdc"}
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"
RETENTION_DAYS=7

echo "Starting database backup..."

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "Dumping database to $BACKUP_FILE..."
pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup successful: $BACKUP_FILE"
    echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Cleanup old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -exec rm {} \;
echo "✅ Cleanup complete."
