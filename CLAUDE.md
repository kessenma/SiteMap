# SiteMap

Field-inspection platform with a web dashboard and offline-capable React Native mobile app. Inspectors mark locations on uploaded facility maps, attach photos, and sync data across devices via PowerSync.

## Project Structure

```
apps/web/                    React 19 + TanStack Start + Drizzle ORM + PostgreSQL
apps/mobile/                 React Native 0.84 + PowerSync + op-sqlite (SQLCipher)
apps/powersync-server/       Docker-based PowerSync sync server
apps/object-storage/         Docker-based file storage
apps/notifications-server/   Go microservice + Gorush push gateway (APNs/FCM)
packages/shared/             Zod schemas, TypeScript types, theme tokens
```

## Key Commands

```bash
# Dev servers
pnpm --filter @sitemap/web dev          # Web on port 3000
pnpm --filter @sitemap/mobile start     # Metro/Repack bundler

# Type checking
pnpm --filter @sitemap/shared check-types
pnpm --filter @sitemap/web check-types

# Database migrations (see docs/migrations.md for full guide)
pnpm --filter @sitemap/web drizzle-kit generate   # Generate migration from schema changes
pnpm --filter @sitemap/web drizzle-kit push       # Push schema directly to dev DB
pnpm --filter @sitemap/web drizzle-kit studio     # Visual DB browser
```

## Shared Schema (Single Source of Truth)

All entity definitions live in `packages/shared/src/schema/`. Both apps import from here.

- **Zod schemas** for runtime validation: `userSchema`, `projectSchema`, `mapSchema`, etc.
- **TypeScript types** inferred from Zod: `User`, `Project`, `SiteMap`, etc.
- **Enums**: `userRoleEnum`, `markerStatusEnum`, `iconShapeEnum`, `fileTypeEnum`
- **Constants**: `TABLE_NAMES` and `COLUMNS` for consistent table/column name strings

Import paths:
```ts
import { userSchema, TABLE_NAMES, COLUMNS } from '@sitemap/shared/schema';
import type { User, MapMarker } from '@sitemap/shared/types';  // backward compat
```

When adding a new entity: create schema in `packages/shared/src/schema/`, add Drizzle table in `apps/web/src/db/schema.ts`, add PowerSync table in `apps/mobile/src/db/powerSyncSchema.ts`, add sync stream in `apps/powersync-server/config/sync-config.yaml`.

## Database

- **Web**: PostgreSQL via Drizzle ORM (`apps/web/src/db/schema.ts`)
- **Mobile**: SQLite via PowerSync + op-sqlite (`apps/mobile/src/db/powerSyncSchema.ts`)
- **Initial SQL migration**: `db/migrations/001_initial.sql`
- **Drizzle config**: `apps/web/drizzle.config.ts`
- **Sync config**: `apps/powersync-server/config/sync-config.yaml`

All tables use UUID primary keys, `created_at`/`updated_at` timestamps, and cascade deletes on parent-child relationships. See `docs/database.md` for the full schema reference.

## Authentication

Self-hosted **better-auth** with email/password, TOTP 2FA, and WebAuthn passkeys. See `CLAUDE-auth.md` for the full reference and `docs/authentication.md` for detailed docs.

- **Server**: `apps/web/src/lib/auth.ts` (better-auth config) + `apps/web/src/server/webauthn.ts` (custom WebAuthn handlers)
- **Web client**: `apps/web/src/lib/auth-client.ts` (better-auth React client) + `apps/web/src/hooks/usePasskey.ts`
- **Mobile client**: `apps/mobile/src/services/AuthService.ts` (REST) + `apps/mobile/src/hooks/usePasskey.ts`
- **Shared validation**: `packages/shared/src/auth/index.ts` (Zod schemas, role options)
- **Routes**: All `/api/auth/*` handled by Vite middleware (dev) / Bun server (prod). WebAuthn routes under `/api/auth/webauthn/*`, everything else goes to better-auth.
- **User roles**: `admin`, `operator`, `technician` (Zod enum in shared schema)
- **DB tables**: `users`, `sessions`, `accounts`, `verifications`, `two_factors`, `passkey_credentials`

## Environment

Central `.env` at repo root. Key vars: `DATABASE_URL`, `JWT_SECRET`, `POWERSYNC_PORT`, `WEB_PORT`, `NOTIFICATIONS_PORT`, `IOS_BUNDLE_ID`, `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`.

## Documentation

Detailed docs in the `docs/` folder:
- `docs/architecture.md` — monorepo structure and tech stack
- `docs/database.md` — all tables, fields, relationships, cross-app mapping
- `docs/data-flow.md` — write paths, sync, auth, timestamps
- `docs/shared-schema.md` — how to use and extend the shared schema
- `docs/migrations.md` — database migration workflow
- `docs/push-notifications.md` — push notification architecture and setup
- `docs/authentication.md` — auth architecture, passkeys, 2FA, and session management

## Important Conventions

- Shared Zod schemas use **snake_case** field names matching DB columns
- Drizzle maps snake_case DB columns to camelCase JS properties internally
- PowerSync stores all timestamps as text (ISO strings)
- The mobile bundler is Repack (rspack), not Metro — aliases for `@sitemap/shared/*` are in `apps/mobile/rspack.config.mjs`
- Package manager is **pnpm** with workspaces
