#!/bin/bash

# RustFS Entrypoint Script with Bucket Auto-Creation
set -e

BUCKET="${OBJECT_STORAGE_BUCKET:-sitemap-media}"
ACCESS_KEY="${RUSTFS_ACCESS_KEY:-${OBJECT_STORAGE_KEY:-admin}}"
SECRET_KEY="${RUSTFS_SECRET_KEY:-${OBJECT_STORAGE_SECRET:-admin}}"
ADDRESS="${RUSTFS_ADDRESS:-:9100}"
PORT="${ADDRESS#:}"
REGION="${RUSTFS_GLOBAL_REGION:-${OBJECT_STORAGE_REGION:-us-east-1}}"
CONSOLE_ENABLE="${RUSTFS_CONSOLE_ENABLE:-true}"
SERVER_DOMAINS="${RUSTFS_SERVER_DOMAINS:-${OBJECT_STORAGE_ENDPOINT}}"

echo "========================================"
echo "RustFS Entrypoint - Auto-Bucket Creation"
echo "========================================"
echo ""
echo "Configuration:"
echo "  Address:       $ADDRESS"
echo "  Port:          $PORT"
echo "  Bucket:        $BUCKET"
echo "  Region:        $REGION"
echo "  Console:       $CONSOLE_ENABLE"
echo "  Access Key:    ${ACCESS_KEY:0:4}***"
echo ""

RUSTFS_CMD="/usr/bin/rustfs"
RUSTFS_ARGS=(
    "--address" "$ADDRESS"
)

if [ "$CONSOLE_ENABLE" = "true" ]; then
    RUSTFS_ARGS+=("--console-enable")
fi

if [ -n "$ACCESS_KEY" ]; then
    RUSTFS_ARGS+=("--access-key" "$ACCESS_KEY")
fi

if [ -n "$SECRET_KEY" ]; then
    RUSTFS_ARGS+=("--secret-key" "$SECRET_KEY")
fi

if [ -n "$SERVER_DOMAINS" ]; then
    RUSTFS_ARGS+=("--server-domains" "$SERVER_DOMAINS")
fi

if [ -n "$REGION" ]; then
    RUSTFS_ARGS+=("--region" "$REGION")
fi

RUSTFS_ARGS+=("/data")

echo "Starting RustFS Server..."
echo "Command: $RUSTFS_CMD ${RUSTFS_ARGS[*]}"
echo ""

# Start RustFS in the background
"$RUSTFS_CMD" "${RUSTFS_ARGS[@]}" &
RUSTFS_PID=$!

echo "RustFS started with PID: $RUSTFS_PID"

# Wait for RustFS to be ready
echo "Waiting for RustFS to be ready..."
MAX_WAIT=60
WAIT_COUNT=0

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if wget --spider --quiet --timeout=2 "http://localhost:$PORT/rustfs/health/live" 2>/dev/null; then
        echo "RustFS is ready!"
        break
    fi

    if ! kill -0 $RUSTFS_PID 2>/dev/null; then
        echo "RustFS process died during startup!"
        exit 1
    fi

    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "RustFS failed to start within $MAX_WAIT seconds"
    kill $RUSTFS_PID 2>/dev/null || true
    exit 1
fi

# Create bucket
echo ""
echo "Creating Bucket: $BUCKET"

if curl -s -f -I --user "$ACCESS_KEY:$SECRET_KEY" "http://localhost:$PORT/$BUCKET/" >/dev/null 2>&1; then
    echo "Bucket '$BUCKET' already exists"
else
    echo "Bucket '$BUCKET' does not exist. Creating..."
    response=$(curl -s -w "\n%{http_code}" -X PUT \
        --user "$ACCESS_KEY:$SECRET_KEY" \
        "http://localhost:$PORT/$BUCKET/" 2>&1)

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ] || [ "$http_code" = "409" ]; then
        echo "Bucket '$BUCKET' created successfully!"
    else
        echo "Warning: Could not auto-create bucket (HTTP $http_code)"
        echo "Create manually via console at http://localhost:9001/rustfs/console/index.html"
    fi
fi

echo ""
echo "RustFS is running."
echo "  S3 API:  http://localhost:$PORT"
echo "  Console: http://localhost:9001/rustfs/console/index.html"
echo "  Bucket:  $BUCKET"
echo ""

# Wait for RustFS process
wait $RUSTFS_PID
