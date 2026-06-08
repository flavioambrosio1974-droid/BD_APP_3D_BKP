# BD_APP_3D_BKP

Infraestrutura e scripts para a base do servidor do projeto de custos da impressora 3D.

## O que este repositório contém

- `scripts/setup_postgres.sh`
  - sobe um PostgreSQL 16 em Docker
  - cria a rede interna `infra`
  - configura backup diário por `pg_dump`
  - agenda a rotina via `cron`

- `scripts/setup_postgres_incremental_backup.sh`
  - ativa arquivamento contínuo de WAL
  - gera backup base diário
  - mantém retenção básica de `WAL` e backups base

- `scripts/restore_postgres_base.sh`
  - extrai um backup base tar.gz para um diretório de validação
  - serve para checar se o backup é restaurável antes de mexer no banco real

- `database/schema.sql`
  - esquema inicial do banco do app
  - cobre usuários, impressoras, materiais, lotes, pedidos, custos e views de resumo

- `docs/data-model.md`
  - leitura humana do modelo de dados e da lógica de custo

- `backend/`
  - API FastAPI com CRUD genérico para os principais recursos
  - já preparada para conversar com o Postgres do servidor via `DATABASE_URL`

## Como a estratégia de backup funciona

- `WAL` arquivado em `/opt/backups/postgres/wal`
- backup base diário em `/opt/backups/postgres/base`
- retenção:
  - `WAL`: 3 dias
  - backup base: 7 dias

## Premissas do servidor

- Ubuntu 24.04 LTS
- Docker Engine oficial
- volume persistente para o banco
- banco sem porta pública exposta

## Observações

- O `pg_dump` diário ficou disponível como rotina simples no início.
- O fluxo incremental real do PostgreSQL usa backup base + `WAL`.
- A base do banco roda no container `custo3d-postgres`.

## Próximos passos sugeridos

1. criar o app de custos com backend e frontend
2. adicionar migrações e modelo de dados
3. documentar o restore point-in-time
4. automatizar cópia dos backups para outro destino
5. validar restore base em rotina agendada ou manual
6. criar o backend CRUD em cima do schema
