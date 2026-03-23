# Database Schema

All tables are defined in three places. The shared Zod schemas in `packages/shared/src/schema/` are the canonical reference.

| Location | Format | Engine |
|----------|--------|--------|
| `packages/shared/src/schema/` | Zod schemas + TypeScript types | N/A (validation & types) |
| `apps/web/src/db/schema.ts` | Drizzle ORM (`pgTable`) | PostgreSQL |
| `apps/mobile/src/db/powerSyncSchema.ts` | PowerSync `Table` | SQLite (op-sqlite) |

---

## Tables

### `users`

| Column | PG Type | PowerSync | Zod | Notes |
|--------|---------|-----------|-----|-------|
| `id` | uuid PK | implicit PK | `z.string().uuid()` | Auto-generated |
| `email` | text (unique) | text | `z.string().email()` | |
| `name` | text | text | `z.string()` | Default: `''` |
| `role` | text enum | text | `userRoleEnum` | `'admin' \| 'operator' \| 'technician'`, default: `'technician'` |
| `email_verified` | boolean | — | `z.boolean()` | Default: `false` |
| `image` | text (nullable) | — | `z.string().nullable()` | Profile image URL |
| `is_active` | boolean | — | `z.boolean()` | Default: `true` |
| `created_at` | timestamptz | text | `z.string()` | |
| `updated_at` | timestamptz | text | `z.string()` | |

**Shared schema:** `userSchema` in `packages/shared/src/schema/users.ts`
**Type:** `User`

---

### `sessions` (auth)

| Column | PG Type | Notes |
|--------|---------|-------|
| `id` | text PK | |
| `user_id` | uuid FK → users | Cascade delete |
| `token` | text (unique) | Session token |
| `expires_at` | timestamptz | |
| `ip_address` | text (nullable) | |
| `user_agent` | text (nullable) | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Web-only** — not synced to mobile.

---

### `accounts` (auth)

| Column | PG Type | Notes |
|--------|---------|-------|
| `id` | text PK | |
| `user_id` | uuid FK → users | Cascade delete |
| `account_id` | text | External provider account ID |
| `provider_id` | text | Auth provider name |
| `access_token` | text (nullable) | |
| `refresh_token` | text (nullable) | |
| `access_token_expires_at` | timestamptz (nullable) | |
| `refresh_token_expires_at` | timestamptz (nullable) | |
| `scope` | text (nullable) | |
| `id_token` | text (nullable) | |
| `password` | text (nullable) | For credential-based auth |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Web-only** — not synced to mobile.

---

### `verifications` (auth)

| Column | PG Type | Notes |
|--------|---------|-------|
| `id` | text PK | |
| `identifier` | text | Email or phone |
| `value` | text | Verification code/token |
| `expires_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Web-only** — not synced to mobile.

---

### `facilities`

| Column | PG Type | PowerSync | Zod | Notes |
|--------|---------|-----------|-----|-------|
| `id` | uuid PK | implicit PK | `z.string().uuid()` | |
| `name` | text | text | `z.string()` | |
| `address` | text | text | `z.string()` | Default: `''` |
| `created_at` | timestamptz | text | `z.string()` | |
| `updated_at` | timestamptz | text | `z.string()` | |

**Shared schema:** `facilitySchema` in `packages/shared/src/schema/facilities.ts`
**Type:** `Facility`

---

### `projects`

| Column | PG Type | PowerSync | Zod | Notes |
|--------|---------|-----------|-----|-------|
| `id` | uuid PK | implicit PK | `z.string().uuid()` | |
| `name` | text | text | `z.string()` | |
| `description` | text | text | `z.string()` | Default: `''` |
| `address` | text | text | `z.string()` | Default: `''` |
| `created_by` | uuid FK → users | text | `z.string().uuid().nullable()` | |
| `created_at` | timestamptz | text | `z.string()` | |
| `updated_at` | timestamptz | text | `z.string()` | |

**Indexes:** `idx_projects_created_by` (created_by)
**Shared schema:** `projectSchema` in `packages/shared/src/schema/projects.ts`
**Type:** `Project`

---

### `maps`

| Column | PG Type | PowerSync | Zod | Notes |
|--------|---------|-----------|-----|-------|
| `id` | uuid PK | implicit PK | `z.string().uuid()` | |
| `project_id` | uuid FK → projects | text | `z.string().uuid()` | Cascade delete |
| `facility_id` | uuid FK → facilities | text | `z.string().uuid().nullable()` | |
| `name` | text | text | `z.string()` | |
| `description` | text | text | `z.string()` | Default: `''` |
| `file_type` | text enum | text | `fileTypeEnum` | `'pdf' \| 'image'` |
| `file_uri` | text | text | `z.string()` | Local path or remote URL |
| `file_name` | text | text | `z.string()` | |
| `file_size` | integer | integer | `z.number().int()` | Bytes |
| `width` | real | real | `z.number()` | Pixels |
| `height` | real | real | `z.number()` | Pixels |
| `created_by` | uuid FK → users | text | `z.string().uuid().nullable()` | |
| `created_at` | timestamptz | text | `z.string()` | |
| `updated_at` | timestamptz | text | `z.string()` | |

**Indexes:** `idx_maps_project_id`, `idx_maps_facility_id`
**Shared schema:** `mapSchema` in `packages/shared/src/schema/maps.ts`
**Type:** `SiteMap`

---

### `map_keys`

| Column | PG Type | PowerSync | Zod | Notes |
|--------|---------|-----------|-----|-------|
| `id` | uuid PK | implicit PK | `z.string().uuid()` | |
| `map_id` | uuid FK → maps | text | `z.string().uuid()` | Cascade delete |
| `label` | text | text | `z.string()` | e.g. "Fire Extinguisher" |
| `icon_name` | text | text | `z.string()` | Lucide icon name |
| `icon_color` | text | text | `z.string()` | Hex color, default: `'#3B82F6'` |
| `icon_shape` | text enum | text | `iconShapeEnum` | `'circle' \| 'square' \| 'triangle' \| 'diamond'` |
| `custom_icon_uri` | text (nullable) | text | `z.string().nullable()` | User-uploaded icon |
| `sort_order` | integer | integer | `z.number().int()` | Default: `0` |
| `created_at` | timestamptz | text | `z.string()` | |
| `updated_at` | timestamptz | text | `z.string()` | |

**Indexes:** `idx_map_keys_map_id`
**Shared schema:** `mapKeySchema` in `packages/shared/src/schema/map-keys.ts`
**Type:** `MapKey`

---

### `map_markers`

| Column | PG Type | PowerSync | Zod | Notes |
|--------|---------|-----------|-----|-------|
| `id` | uuid PK | implicit PK | `z.string().uuid()` | |
| `map_id` | uuid FK → maps | text | `z.string().uuid()` | Cascade delete |
| `key_id` | uuid FK → map_keys | text | `z.string().uuid()` | Cascade delete |
| `x` | real | real | `z.number()` | 0-100 percentage |
| `y` | real | real | `z.number()` | 0-100 percentage |
| `label` | text | text | `z.string()` | Optional override |
| `description` | text | text | `z.string()` | |
| `status` | text enum | text | `markerStatusEnum` | `'active' \| 'resolved' \| 'flagged'` |
| `created_by` | uuid FK → users | text | `z.string().uuid().nullable()` | |
| `created_at` | timestamptz | text | `z.string()` | |
| `updated_at` | timestamptz | text | `z.string()` | |

**Indexes:** `idx_map_markers_map_id`, `idx_map_markers_key_id`, PowerSync: `by_map_key` composite
**Shared schema:** `mapMarkerSchema` in `packages/shared/src/schema/map-markers.ts`
**Type:** `MapMarker`

---

### `marker_photos`

| Column | PG Type | PowerSync | Zod | Notes |
|--------|---------|-----------|-----|-------|
| `id` | uuid PK | implicit PK | `z.string().uuid()` | |
| `marker_id` | uuid FK → map_markers | text | `z.string().uuid()` | Cascade delete |
| `file_uri` | text | text | `z.string()` | Local path or remote URL |
| `file_name` | text | text | `z.string()` | |
| `file_size` | integer | integer | `z.number().int()` | Bytes |
| `caption` | text | text | `z.string()` | |
| `taken_at` | timestamptz | text | `z.string()` | |
| `created_at` | timestamptz | text | `z.string()` | |

**Note:** No `updated_at` column on this table.
**Indexes:** `idx_marker_photos_marker_id`
**Shared schema:** `markerPhotoSchema` in `packages/shared/src/schema/marker-photos.ts`
**Type:** `MarkerPhoto`

---

## Relationships

```
users
  ├── sessions.user_id (CASCADE)
  ├── accounts.user_id (CASCADE)
  ├── projects.created_by
  ├── maps.created_by
  └── map_markers.created_by

facilities
  └── maps.facility_id

projects
  └── maps.project_id (CASCADE)
      └── map_keys.map_id (CASCADE)
      └── map_markers.map_id (CASCADE)
          └── marker_photos.marker_id (CASCADE)
      map_markers.key_id → map_keys (CASCADE)
```

All parent-child relationships use `ON DELETE CASCADE` — deleting a project removes all its maps, keys, markers, and photos.

## Enums

| Enum | Values | Shared constant |
|------|--------|-----------------|
| User role | `admin`, `operator`, `technician` | `userRoleEnum` |
| Marker status | `active`, `resolved`, `flagged` | `markerStatusEnum` |
| Icon shape | `circle`, `square`, `triangle`, `diamond` | `iconShapeEnum` |
| File type | `pdf`, `image` | `fileTypeEnum` |

## PostgreSQL Configuration for PowerSync

PowerSync requires **logical replication** to stream changes from PostgreSQL to mobile devices. This must be configured on the PostgreSQL server before PowerSync will work.

### Required setting

```sql
ALTER SYSTEM SET wal_level = 'logical';
```

**A full PostgreSQL restart is required** after changing this setting (`SELECT pg_reload_conf()` is not sufficient).

### Why this is needed

PowerSync uses PostgreSQL logical replication slots to capture row-level changes (inserts, updates, deletes) and stream them to mobile clients. The default `wal_level = replica` only supports physical replication and does not include the logical decoding information PowerSync needs.

### How to verify

```sql
SHOW wal_level;
-- Should return: logical
```

### Troubleshooting

If PowerSync logs show this error repeatedly:

> `wal_level must be set to 'logical', your database has it set to 'replica'`

Run the `ALTER SYSTEM` command above, then restart PostgreSQL. If running in Docker:

```bash
docker exec <postgres-container> psql -U postgres -c "ALTER SYSTEM SET wal_level = 'logical';"
docker restart <postgres-container>
```

### Related PowerSync settings

These are configured via environment variables in `docker-compose.powersync.yml`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `POWERSYNC_SLOT_NAME` | `powersync_sitemap_slot` | Replication slot name |
| `POWERSYNC_PUBLICATION` | `powersync_sitemap_pub` | Publication name |

To clean up stale replication slots (e.g., after a crash):

```sql
SELECT pg_drop_replication_slot(slot_name)
FROM pg_replication_slots
WHERE slot_name LIKE '%powersync%';
```

---

## Sync Streams (PowerSync)

All tables are synced to mobile via PowerSync Edition 3 streams defined in `apps/powersync-server/config/sync-config.yaml`:

| Stream | Tables | Scope |
|--------|--------|-------|
| `user_profile` | users | Own user only (`auth.user_id()`) |
| `facilities` | facilities | All |
| `projects` | projects | All |
| `project_data` | maps, map_keys, map_markers, marker_photos | All |
