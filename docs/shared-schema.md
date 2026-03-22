# Shared Schema Guide

The `@sitemap/shared/schema` package is the single source of truth for all entity definitions across web and mobile.

## What's in the Schema Package

```
packages/shared/src/schema/
├── index.ts            # Barrel export
├── enums.ts            # Zod enums (userRole, markerStatus, iconShape, fileType)
├── tables.ts           # TABLE_NAMES and COLUMNS constants
├── users.ts            # userSchema + User type
├── facilities.ts       # facilitySchema + Facility type
├── projects.ts         # projectSchema + Project type
├── maps.ts             # mapSchema + SiteMap type
├── map-keys.ts         # mapKeySchema + MapKey type
├── map-markers.ts      # mapMarkerSchema + MapMarker type
└── marker-photos.ts    # markerPhotoSchema + MarkerPhoto type
```

## Usage

### Import types

```ts
import type { User, MapMarker, MarkerStatus } from '@sitemap/shared/schema';
```

### Runtime validation

```ts
import { userSchema } from '@sitemap/shared/schema';

const result = userSchema.safeParse(data);
if (result.success) {
  // result.data is typed as User
}
```

### Table and column constants

```ts
import { TABLE_NAMES, COLUMNS } from '@sitemap/shared/schema';

TABLE_NAMES.mapMarkers  // → 'map_markers'
COLUMNS.maps.projectId  // → 'project_id'
```

### Enum values in Drizzle

```ts
import { userRoleEnum } from '@sitemap/shared/schema';

text('role', { enum: userRoleEnum.options })  // ['admin', 'inspector', 'viewer']
```

## How the Apps Use It

| App | Schema file | Uses from shared |
|-----|-------------|-----------------|
| Web | `apps/web/src/db/schema.ts` | `TABLE_NAMES`, `COLUMNS`, enum `.options` for Drizzle column defs |
| Mobile | `apps/mobile/src/db/powerSyncSchema.ts` | Types for record interfaces, enums for validation |

The ORM-specific schemas (Drizzle `pgTable`, PowerSync `Table`) stay in each app because they target different databases (PostgreSQL vs SQLite). The shared schema ensures field names and enum values are consistent.

## Adding a New Entity

1. Create `packages/shared/src/schema/new-entity.ts`:
   ```ts
   import { z } from 'zod';

   export const newEntitySchema = z.object({
     id: z.string().uuid(),
     name: z.string(),
     created_at: z.string(),
     updated_at: z.string(),
   });

   export type NewEntity = z.infer<typeof newEntitySchema>;
   ```

2. Add table/column entries to `tables.ts`:
   ```ts
   // In TABLE_NAMES:
   newEntities: 'new_entities',

   // In COLUMNS:
   newEntities: {
     id: 'id',
     name: 'name',
     createdAt: 'created_at',
     updatedAt: 'updated_at',
   },
   ```

3. Export from `packages/shared/src/schema/index.ts`:
   ```ts
   export * from './new-entity';
   ```

4. Add the Drizzle table in `apps/web/src/db/schema.ts` using the shared constants.

5. Add the PowerSync table in `apps/mobile/src/db/powerSyncSchema.ts`.

6. Add a sync stream query in `apps/powersync-server/config/sync-config.yaml`.

## Conventions

- **Field names in Zod schemas use `snake_case`** — matches DB columns. Drizzle maps these to camelCase JS properties internally.
- **Timestamps are `z.string()`** — universal across PostgreSQL (timestamptz) and SQLite (text).
- **IDs are `z.string().uuid()`** — UUIDs everywhere.
- **Nullable fields use `.nullable()`** — e.g., `custom_icon_uri`, `facility_id`, `created_by`.
- **Backward compat:** `@sitemap/shared/types` re-exports all types from the schema module. Existing imports continue to work.
