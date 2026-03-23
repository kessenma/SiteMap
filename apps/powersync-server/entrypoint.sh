#!/bin/sh
# Entrypoint script for PowerSync that parses DATABASE_URL

set -e

echo "Starting SiteMap PowerSync entrypoint..."

if [ -n "$DATABASE_URL" ]; then
  echo "Parsing DATABASE_URL for PowerSync configuration..."

  CLEAN_URL="$DATABASE_URL"
  while true; do
    case "$CLEAN_URL" in
      DATABASE_URL=*) CLEAN_URL="${CLEAN_URL#DATABASE_URL=}" ;;
      *) break ;;
    esac
  done

  case "$CLEAN_URL" in
    postgresql://*|postgres://*) ;;
    *)
      echo "ERROR: DATABASE_URL must start with postgresql:// or postgres://"
      exit 1
      ;;
  esac

  DB_URL_NO_PROTO="${CLEAN_URL#postgresql://}"
  DB_URL_NO_PROTO="${DB_URL_NO_PROTO#postgres://}"

  DB_URL_MAIN="${DB_URL_NO_PROTO%%\?*}"

  DB_QUERY_STRING=""
  case "$DB_URL_NO_PROTO" in
    *\?*) DB_QUERY_STRING="${DB_URL_NO_PROTO#*\?}" ;;
  esac

  USER_PASS="${DB_URL_MAIN%%@*}"
  DB_USER="${USER_PASS%%:*}"
  DB_PASS="${USER_PASS#*:}"

  HOST_PORT_DB="${DB_URL_MAIN#*@}"
  HOST_PORT="${HOST_PORT_DB%%/*}"
  DB_NAME="${HOST_PORT_DB#*/}"

  DB_HOST="${HOST_PORT%%:*}"
  DB_PORT="${HOST_PORT#*:}"
  [ "$DB_PORT" = "$DB_HOST" ] && DB_PORT="5432"
  [ -z "$DB_NAME" ] && DB_NAME="postgres"

  DB_SSL_MODE="disable"
  case "$DB_QUERY_STRING" in
    *sslmode=require*) DB_SSL_MODE="require" ;;
    *sslmode=verify-full*) DB_SSL_MODE="verify-full" ;;
    *sslmode=verify-ca*) DB_SSL_MODE="verify-ca" ;;
    *sslmode=prefer*) DB_SSL_MODE="prefer" ;;
    *sslmode=allow*) DB_SSL_MODE="allow" ;;
    *sslmode=disable*) DB_SSL_MODE="disable" ;;
  esac

  echo "Parsed: host=$DB_HOST port=$DB_PORT user=$DB_USER database=$DB_NAME sslmode=$DB_SSL_MODE"

  POSTGRES_URI="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
else
  echo "WARNING: DATABASE_URL not set! Using fallback environment variables..."
  DB_HOST="${POSTGRES_HOST:-localhost}"
  DB_PORT="${POSTGRES_PORT:-5432}"
  DB_USER="${POSTGRES_USER:-postgres}"
  DB_PASS="${POSTGRES_PASSWORD:-}"
  DB_NAME="${POSTGRES_DB:-postgres}"
  DB_SSL_MODE="${POSTGRES_SSL_MODE:-disable}"
  POSTGRES_URI="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

if [ -z "$JWT_SECRET" ]; then
  echo "WARNING: JWT_SECRET not set!"
  JWT_KEY_B64URL=""
else
  JWT_KEY_B64URL=$(echo -n "$JWT_SECRET" | tr '+/' '-_' | tr -d '=')
  echo "JWT key encoded for JWKS (length: ${#JWT_KEY_B64URL})"
fi

POWERSYNC_PORT_VAL="${POWERSYNC_PORT:-6061}"
SYNC_RULES_PATH="${POWERSYNC_SYNC_RULES_PATH:-/config/sync-config.yaml}"
LOG_LEVEL="${POWERSYNC_LOG_LEVEL:-info}"
SLOT_NAME="${POWERSYNC_SLOT_NAME:-powersync_sitemap_slot}"
PUBLICATION_NAME="${POWERSYNC_PUBLICATION:-powersync_sitemap_pub}"

echo "Generating PowerSync configuration..."
echo "Database: ${DB_HOST}:${DB_PORT}/${DB_NAME} (ssl: ${DB_SSL_MODE})"

cat > /config/config.yaml << EOF
replication:
  connections:
    - type: postgresql
      uri: ${POSTGRES_URI}
      sslmode: ${DB_SSL_MODE}
      slot_name: ${SLOT_NAME}
      publication_name: ${PUBLICATION_NAME}

storage:
  type: postgresql
  uri: ${POSTGRES_URI}
  sslmode: ${DB_SSL_MODE}

port: ${POWERSYNC_PORT_VAL}

sync_rules:
  path: ${SYNC_RULES_PATH}

client_auth:
  supabase: false
  jwks:
    keys:
      - kid: "sitemap-key"
        kty: oct
        k: ${JWT_KEY_B64URL}
        alg: HS256
  audience: ["powersync", "powersync-dev"]
  issuer: ${PROD_API_URL:-https://sitemap.live}

telemetry:
  disable_telemetry_sharing: true

diagnostics:
  disable: false

log_level: ${LOG_LEVEL}
EOF

echo "Configuration generated successfully!"
echo "Starting PowerSync server on port ${POWERSYNC_PORT_VAL}..."
cd /app
exec node /app/service/lib/entry.js start -r unified
