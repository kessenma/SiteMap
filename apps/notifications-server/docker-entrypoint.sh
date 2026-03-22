#!/bin/sh
# Decode the APNs .p8 key from base64 env var into a file for gorush
set -e

mkdir -p /keys

if [ -n "$APNS_KEY_BASE64" ]; then
  echo "$APNS_KEY_BASE64" | base64 -d > /keys/AuthKey.p8
  echo "APNs key written to /keys/AuthKey.p8"
else
  echo "Warning: APNS_KEY_BASE64 not set, iOS push notifications will not work"
fi

# Start gorush
exec /bin/gorush -c /home/gorush/config.yml "$@"
