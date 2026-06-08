#!/usr/bin/env bash
set -euo pipefail

install -d -m 755 /opt/stacks/postgres /opt/backups/postgres /opt/scripts

if [ ! -f /opt/stacks/postgres/.env ]; then
  DB_PASSWORD=$(openssl rand -base64 36 | tr -d '=/+' | cut -c1-28)
  cat > /opt/stacks/postgres/.env <<EOF
POSTGRES_DB=custo3d
POSTGRES_USER=custo3d
POSTGRES_PASSWORD=$DB_PASSWORD
EOF
  chmod 600 /opt/stacks/postgres/.env
fi

if ! docker network inspect infra >/dev/null 2>&1; then
  docker network create infra >/dev/null
fi

cat > /opt/stacks/postgres/compose.yml <<'YAML'
services:
  postgres:
    image: postgres:16
    container_name: custo3d-postgres
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - postgres_data:/var/lib/postgresql/data
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

cat > /opt/scripts/backup-custo3d-postgres.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail

cd /opt/stacks/postgres
set -a
. ./.env
set +a

stamp=$(date +%F_%H-%M-%S)
out="/opt/backups/postgres/${stamp}_custo3d.sql.gz"
docker exec custo3d-postgres sh -lc 'exec pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip -9 > "$out"
find /opt/backups/postgres -type f -name '*.sql.gz' -mtime +14 -delete
SH

chmod 750 /opt/scripts/backup-custo3d-postgres.sh

cat > /etc/cron.d/custo3d-postgres-backup <<'CRON'
30 3 * * * root /opt/scripts/backup-custo3d-postgres.sh >/var/log/custo3d-postgres-backup.log 2>&1
CRON
chmod 644 /etc/cron.d/custo3d-postgres-backup
systemctl restart cron 2>/dev/null || true

docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
echo
docker logs --tail 50 custo3d-postgres
echo
ls -l /opt/stacks/postgres
echo
cat /opt/stacks/postgres/.env
