# Database Migrations

## Overview

The project uses two migration approaches:

| Method | When to use |
|--------|-------------|
| **Raw SQL** (`db/migrations/`) | Initial setup, production deployments, PowerSync publication changes |
| **Drizzle Kit** (`apps/web/drizzle.config.ts`) | Schema iteration during development |

## Migration Workflow

### 1. Update the shared schema first

Every schema change starts in `packages/shared/src/schema/`. This ensures types, enums, and column names stay in sync across all apps.

```bash
# Example: adding a "priority" field to map_markers
```

**a)** Add the field to the Zod schema in `packages/shared/src/schema/map-markers.ts`:
```ts
priority: z.number().int(),
```

**b)** Add the column constant in `packages/shared/src/schema/tables.ts`:
```ts
// In COLUMNS.mapMarkers:
priority: 'priority',
```

**c)** If adding a new enum, define it in `packages/shared/src/schema/enums.ts`.

### 2. Update the Drizzle schema

Add the column in `apps/web/src/db/schema.ts` using the shared constants:

```ts
import { COLUMNS } from '@sitemap/shared/schema';

// In the mapMarkers table:
priority: integer(COLUMNS.mapMarkers.priority).notNull().default(0),
```

### 3. Generate or write the migration

**Option A — Drizzle Kit (development)**

```bash
# Generate a migration file from schema diff
pnpm --filter @sitemap/web drizzle-kit generate

# Or push directly to dev database (no migration file)
pnpm --filter @sitemap/web drizzle-kit push
```

Generated migrations go to `apps/web/drizzle/`. Review them before applying.

**Option B — Raw SQL (production)**

Create a new numbered migration file in `db/migrations/`:

```sql
-- db/migrations/002_add_marker_priority.sql
ALTER TABLE map_markers ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;
```

Apply it to your database:

```bash
psql $DATABASE_URL -f db/migrations/002_add_marker_priority.sql
```

### 4. Update the PowerSync schema

Add the column in `apps/mobile/src/db/powerSyncSchema.ts`:

```ts
priority: column.integer,
```

PowerSync uses SQLite locally — column types are limited to `column.text`, `column.integer`, and `column.real`.

### 5. Update PowerSync sync config (if needed)

If you added a new table, add it to a sync stream in `apps/powersync-server/config/sync-config.yaml`:

```yaml
streams:
  project_data:
    queries:
      - SELECT * FROM maps
      - SELECT * FROM map_keys
      - SELECT * FROM map_markers
      - SELECT * FROM marker_photos
      - SELECT * FROM new_table_here   # <-- add new tables
```

If you added a column to an existing table, no sync config change is needed — `SELECT *` picks it up automatically.

### 6. Update the PowerSync publication (if needed)

If you added a new table, add it to the PostgreSQL publication so PowerSync can replicate it:

```sql
ALTER PUBLICATION powersync_sitemap_pub ADD TABLE new_table_here;
```

### 7. Verify

```bash
# Type check all packages
pnpm --filter @sitemap/shared check-types
pnpm --filter @sitemap/web check-types

# Verify Drizzle schema matches DB
pnpm --filter @sitemap/web drizzle-kit check
```

## Migration File Naming

Raw SQL migrations in `db/migrations/` use sequential numbering:

```
001_initial.sql
002_add_marker_priority.sql
003_add_inspections_table.sql
```

## Checklist for Schema Changes

- [ ] Update Zod schema in `packages/shared/src/schema/`
- [ ] Update `COLUMNS` constants in `packages/shared/src/schema/tables.ts`
- [ ] Update Drizzle table in `apps/web/src/db/schema.ts`
- [ ] Generate or write SQL migration
- [ ] Apply migration to database
- [ ] Update PowerSync table in `apps/mobile/src/db/powerSyncSchema.ts`
- [ ] Update sync config if new table (`apps/powersync-server/config/sync-config.yaml`)
- [ ] Update publication if new table (`ALTER PUBLICATION ... ADD TABLE`)
- [ ] Run type checks across all packages

## Drizzle Kit Reference

```bash
pnpm --filter @sitemap/web drizzle-kit generate   # Generate migration SQL from schema diff
pnpm --filter @sitemap/web drizzle-kit push        # Push schema to DB (dev only, no migration file)
pnpm --filter @sitemap/web drizzle-kit check       # Compare schema.ts against DB
pnpm --filter @sitemap/web drizzle-kit studio      # Visual DB browser (port 4983)
pnpm --filter @sitemap/web drizzle-kit drop        # Drop a migration (interactive)
```

Config: `apps/web/drizzle.config.ts` — requires `DATABASE_URL` env var.
