# Data Flow

## Overview

```
┌─────────┐      Drizzle ORM      ┌────────────┐    WAL replication    ┌─────────────────┐
│   Web   │ ──────────────────── → │ PostgreSQL │ ───────────────────→  │ PowerSync Server│
│ Dashboard│ ← ──────────────────  │            │                      │   (port 6061)   │
└─────────┘      SQL queries       └────────────┘                      └────────┬────────┘
                                                                                │
                                                                     Sync streams (HTTP)
                                                                                │
                                                                       ┌────────▼────────┐
                                                                       │  Mobile App     │
                                                                       │  (SQLite local) │
                                                                       └─────────────────┘
```

## Write Paths

### Web → PostgreSQL

1. User action in the dashboard triggers a TanStack server function
2. Server function calls Drizzle ORM (`apps/web/src/server/db-queries.ts`)
3. Drizzle executes SQL against PostgreSQL
4. PowerSync picks up the change via WAL replication and pushes to mobile clients

### Mobile → PostgreSQL

1. User creates/edits data in the mobile app
2. PowerSync writes to local SQLite immediately (offline-capable)
3. PowerSync CRUD upload queue sends changes to PostgreSQL via the sync server
4. Other mobile clients receive the change via their sync streams

## Sync Path (PostgreSQL → Mobile)

1. PostgreSQL publishes changes via logical replication (`powersync_sitemap_slot`)
2. PowerSync server receives WAL events
3. Server evaluates sync stream queries (`sync-config.yaml`) to determine which clients get which data
4. Mobile clients receive incremental updates and apply them to local SQLite

### Sync Streams

| Stream | Priority | Auto-subscribe | Scope |
|--------|----------|----------------|-------|
| `user_profile` | 1 | Yes | Own user record only |
| `facilities` | 1 | Yes | All facilities |
| `projects` | 1 | Yes | All projects |
| `project_data` | 2 | Yes | All maps, keys, markers, photos |

Priority 1 streams sync first on initial connection.

## File Storage

Map files and marker photos are stored in the object storage service (`apps/object-storage`). Database records store `file_uri` references pointing to the storage location. On mobile, files may be cached locally with the URI pointing to the local path.

## Authentication

- **Mobile:** JWT tokens stored in MMKV. PowerSync connector includes the JWT in sync requests.
- **Web:** Session-based via server functions.
- **PowerSync server:** Validates JWTs using JWKS (HS256). Expected audiences: `powersync`, `powersync-dev`.

## Timestamp Handling

| Layer | Format |
|-------|--------|
| PostgreSQL | `TIMESTAMP WITH TIME ZONE` |
| Drizzle (JS) | `Date` object |
| PowerSync / SQLite | Text (ISO 8601 string) |
| Shared Zod schema | `z.string()` |

The shared type uses `string` to be universal. Each app parses timestamps as needed.
