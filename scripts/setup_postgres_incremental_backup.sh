#!/usr/bin/env bash
set -euo pipefail

install -d -m 755 /opt/stacks/postgres /opt/backups/postgres/{base,wal} /opt/scripts
chown -R 999:999 /opt/backups/postgres/base /opt/backups/postgres/wal
chmod 755 /opt/backups/postgres/base /opt/backups/postgres/wal

cat > /opt/stacks/postgres/compose.yml <<'YAML'
services:
  postgres:
    image: postgres:16
    container_name: custo3d-postgres
    restart: unless-stopped
    env_file:
      - .env
    command:
      - postgres
      - -c
      - wal_level=replica
      - -c
      - archive_mode=on
      - -c
      - archive_command=test ! -f /backup/wal/%f && cp %p /backup/wal/%f
      - -c
      - archive_timeout=60s
      - -c
      - wal_compression=on
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - /opt/backups/postgres:/backup
    networks:
      - infra
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
volumes:
  postgres_data:
networks:
  infra:
    external: true
YAML

cd /opt/stacks/postgres
docker compose up -d

cat > /opt/scripts/backup-custo3d-postgres-full.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail

cd /opt/stacks/postgres
set -a
. ./.env
set +a

stamp=$(date +%F_%H-%M-%S)
dest="/backup/base/${stamp}"
docker exec -u postgres custo3d-postgres pg_basebackup -U custo3d -D "$dest" -Fp -Xs -P
tar -C "/opt/backups/postgres/base" -czf "/opt/backups/postgres/base/${stamp}.tar.gz" "${stamp}"
rm -rf "/opt/backups/postgres/base/${stamp}"
find /opt/backups/postgres/base -type f -name '*.tar.gz' -mtime +7 -delete
SH

chmod 750 /opt/scripts/backup-custo3d-postgres-full.sh

cat > /etc/cron.d/custo3d-postgres-full-backup <<'CRON'
0 3 * * * root /opt/scripts/backup-custo3d-postgres-full.sh >/var/log/custo3d-postgres-full-backup.log 2>&1
CRON
chmod 644 /etc/cron.d/custo3d-postgres-full-backup

cat > /opt/scripts/prune-custo3d-postgres-wal.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
find /opt/backups/postgres/wal -type f -mtime +3 -delete
SH

chmod 750 /opt/scripts/prune-custo3d-postgres-wal.sh

cat > /etc/cron.d/custo3d-postgres-wal-prune <<'CRON'
15 3 * * * root /opt/scripts/prune-custo3d-postgres-wal.sh >/var/log/custo3d-postgres-wal-prune.log 2>&1
CRON
chmod 644 /etc/cron.d/custo3d-postgres-wal-prune

systemctl restart cron 2>/dev/null || true

docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
echo
docker exec custo3d-postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "show wal_level; show archive_mode; show archive_command; show archive_timeout; show wal_compression;"'
echo
ls -R /opt/backups/postgres | sed -n '1,120p'
