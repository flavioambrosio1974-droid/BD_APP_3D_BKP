#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <base-backup-tar.gz> [restore-dir]" >&2
  exit 1
fi

backup_tar="${1}"
restore_dir="${2:-/opt/restore/postgres-base}"

if [ ! -f "$backup_tar" ]; then
  echo "backup file not found: $backup_tar" >&2
  exit 1
fi

install -d -m 755 "$restore_dir"
tar -xzf "$backup_tar" -C "$restore_dir"

if [ ! -f "$restore_dir/backup_label" ]; then
  echo "restore validation failed: backup_label missing" >&2
  exit 1
fi

echo "restored backup contents into $restore_dir"
echo "files:"
find "$restore_dir" -maxdepth 2 -type f | sort

