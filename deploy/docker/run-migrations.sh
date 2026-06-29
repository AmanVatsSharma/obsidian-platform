#!/bin/sh
# Migrations runner for Docker
# Usage: docker compose -f ../docker/docker-compose.prod.yml run --rm migrations

set -e

echo "Running TypeORM migrations..."

# Wait for database to be ready
until psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; do
    echo "Waiting for database..."
    sleep 2
done

echo "Database is ready."

# Run migrations in the backend directory
cd /app/apps/backend

# Use the proper build-time dependencies
node_modules/.bin/ts-node \
  --transpile-only \
  --require tsconfig-paths/register \
  shared/database/typeorm.config.ts

# Execute migrations
node_modules/.bin/typeorm migration:run \
  -d shared/database/typeorm.config.ts

echo "✓ Migrations completed successfully!"