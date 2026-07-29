#!/bin/sh
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"

echo "Waiting for Postgres at ${DB_HOST}:${DB_PORT}..."
i=0
until node -e "
const net = require('net');
const s = net.connect(${DB_PORT}, '${DB_HOST}', () => { s.end(); process.exit(0); });
s.on('error', () => process.exit(1));
setTimeout(() => process.exit(1), 2000);
"; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "Database not ready after 60s"
    exit 1
  fi
  sleep 1
done

echo "Running migrations..."
./node_modules/.bin/prisma migrate deploy

exec "$@"
