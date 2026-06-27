#!/bin/sh
set -e

# Generate a JWT secret on first boot if one wasn't provided, and persist it to
# the api-data volume so issued tokens survive restarts/redeploys. Lets a Coolify
# deploy work with only ADMIN_USERNAME/ADMIN_PASSWORD set.
# ponytail: single-instance self-host; migrate below is unguarded (no replica lock).
SECRET_FILE=/app/data/jwt.secret
if [ -z "${JWT_SECRET:-}" ]; then
  if [ ! -f "$SECRET_FILE" ]; then
    mkdir -p /app/data
    node -e "process.stdout.write(require('crypto').randomUUID())" > "$SECRET_FILE"
  fi
  JWT_SECRET="$(cat "$SECRET_FILE")"
  export JWT_SECRET
fi

# Bring the DB up to date and ensure the admin user exists (both idempotent).
node dist/db/migrate.js
node dist/db/seed-user.js

exec node dist/main
