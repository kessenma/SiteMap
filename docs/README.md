# SiteMap Documentation

SiteMap is a field-inspection platform with a web dashboard and offline-capable mobile app. Inspectors mark locations on uploaded facility maps, attach photos, and sync data across devices via PowerSync.

## Docs

- [Architecture](./architecture.md) — monorepo structure, tech stack, packages
- [Database](./database.md) — all tables, fields, relationships, cross-app type mapping
- [Data Flow](./data-flow.md) — how data moves between web, mobile, PowerSync, and PostgreSQL
- [Shared Schema](./shared-schema.md) — using `@sitemap/shared/schema`, conventions for adding entities
- [Migrations](./migrations.md) — database migration workflow, checklist for schema changes
