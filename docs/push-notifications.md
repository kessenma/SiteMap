# Push Notifications

Custom push notification system using a Go microservice and [Gorush](https://github.com/appleboy/gorush) as the push gateway for APNs (iOS) and FCM (Android).

## Architecture

```
Mobile App
  │
  ├─ (1) Register device token ──→ Web API (POST /api/push-devices/register)
  │                                    │
  │                                    ▼
  │                               PostgreSQL (push_devices table)
  │                                    ▲
  │                                    │ (3) Query device tokens
  │                                    │
  └─ (5) Receive notification ◄── Gorush ◄── Notifications Server ◄── Web App
                                  (APNs/FCM)   (Go, port 8080)        (2) Trigger
                                  (port 8088)                          notification
```

**Flow:**
1. Mobile app registers its APNs/FCM token with the web backend on login
2. Web app triggers a notification (e.g., when a marker is created)
3. Go server queries `push_devices` table for the user's active tokens
4. Go server sends to Gorush, which forwards to APNs/FCM
5. Mobile device receives the push notification

## Setup

### 1. APNs Key (iOS)

1. Go to [Apple Developer](https://developer.apple.com) > Keys
2. Create a new key with **Apple Push Notifications service (APNs)** enabled
3. Download the `.p8` file (e.g., `AuthKey_XXXXXX.p8`)
4. Note the **Key ID** (from the filename or dashboard) and your **Team ID**
5. Base64-encode the key:
   ```bash
   cat AuthKey_XXXXXX.p8 | base64
   ```
6. Set these in `.env`:
   ```
   APNS_KEY_BASE64=<base64 string>
   APNS_KEY_ID=<key id>
   APNS_TEAM_ID=<team id>
   IOS_BUNDLE_ID=com.yourapp.bundleid
   ```

### 2. FCM Key (Android)

1. Go to [Firebase Console](https://console.firebase.google.com) > Project Settings > Service Accounts
2. Generate a new private key (JSON file)
3. Mount the JSON file in the gorush container at `/keys/fcm-key.json`
4. Set `android.enabled: true` in `apps/notifications-server/gorush-config.yml`

### 3. Database

The `push_devices` table is defined in `apps/web/src/db/schema.ts`. Generate and apply the migration:

```bash
pnpm --filter @sitemap/web drizzle-kit generate
pnpm --filter @sitemap/web drizzle-kit push
```

### 4. Docker

```bash
# Start the notifications server + gorush
docker compose -f docker-compose.notifications.yml up -d

# Check health
curl http://localhost:8080/health
```

## Testing

### Send a test notification via curl

```bash
# Send to a single user
curl -X POST http://localhost:8080/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid-here",
    "title": "Test Notification",
    "message": "Hello from SiteMap!",
    "data": {"type": "test"}
  }'

# Send to multiple users
curl -X POST http://localhost:8080/api/push/send-batch \
  -H "Content-Type: application/json" \
  -d '[
    {"user_id": "user-1-uuid", "title": "Update", "message": "New marker added"},
    {"user_id": "user-2-uuid", "title": "Update", "message": "New marker added"}
  ]'
```

### Check service health

```bash
curl http://localhost:8080/health
# Returns: {"status":"healthy","service":"notifications-server","database_connected":true,"gorush_connected":true,...}
```

## Sending Notifications from Web App Code

```typescript
import { pushNotificationService } from '#/lib/push-notifications'

// Single user
await pushNotificationService.sendToUser(
  userId,
  'New Marker',
  'A new marker was added to your project',
  { projectId: '...', markerId: '...' }
)

// Multiple users
await pushNotificationService.sendToUsers(
  [userId1, userId2],
  'Project Update',
  'The project has been updated'
)
```

## Key Files

| File | Description |
|------|-------------|
| `apps/notifications-server/main.go` | HTTP server with push endpoints |
| `apps/notifications-server/push.go` | Device token queries from PostgreSQL |
| `apps/notifications-server/pusher.go` | Gorush API client |
| `apps/notifications-server/gorush-config.yml` | Gorush APNs/FCM configuration |
| `apps/notifications-server/Dockerfile` | Multi-stage Go build |
| `docker-compose.notifications.yml` | Docker Compose for gorush + notifications server |
| `apps/web/src/db/schema.ts` | `pushDevices` Drizzle table |
| `apps/web/src/server/push-device-queries.ts` | Device token registration server functions |
| `apps/web/src/lib/push-notifications.ts` | Server-side notification trigger service |
| `apps/mobile/src/services/PushNotificationService.ts` | Mobile token registration |
| `apps/mobile/src/components/DeviceRegistration.tsx` | Debug UI for device registration |
| `packages/shared/src/schema/push-devices.ts` | Shared Zod schema |
