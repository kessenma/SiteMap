# Architecture

## Monorepo Structure

```
SiteMap/
├── apps/
│   ├── web/                  # Web dashboard
│   ├── mobile/               # React Native mobile app
│   ├── powersync-server/     # Sync server (Docker)
│   └── object-storage/       # File storage (Docker)
├── packages/
│   └── shared/               # Shared types, schemas, theme
├── docs/                     # This documentation
└── .env                      # Central environment variables
```

**Package manager:** pnpm 8.15.4 with workspaces
**Task runner:** Turborepo
**Node:** >= 22

## Apps

### `apps/web` — Web Dashboard

| Layer | Tech |
|-------|------|
| Framework | React 19 + TanStack Start/Router |
| Database | PostgreSQL via Drizzle ORM |
| Build | Vite + Bun |
| UI | Tailwind CSS + shadcn/ui |
| State | TanStack Query + local collections |

Server functions in `src/server/db-queries.ts` handle data fetching. Drizzle schema in `src/db/schema.ts` imports table/column constants from `@sitemap/shared/schema`.

### `apps/mobile` — Mobile App

| Layer | Tech |
|-------|------|
| Framework | React Native 0.84 + React 19 |
| Local DB | op-sqlite (SQLCipher encrypted) |
| Sync | PowerSync (`@powersync/react-native`) |
| Navigation | React Navigation (stack + bottom tabs) |
| Auth storage | react-native-mmkv |
| Bundler | Repack (rspack) |

Offline-first: all data is stored locally in SQLite and synced to PostgreSQL via PowerSync.

### `apps/powersync-server` — Sync Server

Docker-based PowerSync server. Connects to PostgreSQL via logical replication and serves sync streams to mobile clients. Config in `config/powersync.yaml` and `config/sync-config.yaml`.

### `apps/object-storage` — File Storage

Docker-based object storage for map files and marker photos.

## Shared Package (`packages/shared`)

Exports three modules:

| Import path | Contents |
|-------------|----------|
| `@sitemap/shared/schema` | Zod schemas, inferred types, table/column name constants, enums |
| `@sitemap/shared/types` | Re-exports types from schema (backward compat) |
| `@sitemap/shared/theme` | Color palette, semantic tokens, spacing, typography |

The schema module is the **single source of truth** for entity definitions. Both the Drizzle schema (web) and PowerSync schema (mobile) reference its constants and enums.
