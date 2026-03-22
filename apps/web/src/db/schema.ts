import { pgTable, uuid, text, real, integer, timestamp, index } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull().default(''),
  role: text('role', { enum: ['admin', 'inspector', 'viewer'] }).notNull().default('inspector'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const facilities = pgTable('facilities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  address: text('address').notNull().default(''),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_projects_created_by').on(table.createdBy),
])

export const maps = pgTable('maps', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  facilityId: uuid('facility_id').references(() => facilities.id),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  fileType: text('file_type', { enum: ['pdf', 'image'] }).notNull(),
  fileUri: text('file_uri').notNull().default(''),
  fileName: text('file_name').notNull().default(''),
  fileSize: integer('file_size').notNull().default(0),
  width: real('width').notNull().default(0),
  height: real('height').notNull().default(0),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_maps_project_id').on(table.projectId),
  index('idx_maps_facility_id').on(table.facilityId),
])

export const mapKeys = pgTable('map_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  mapId: uuid('map_id').notNull().references(() => maps.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  iconName: text('icon_name').notNull().default(''),
  iconColor: text('icon_color').notNull().default('#3B82F6'),
  iconShape: text('icon_shape', { enum: ['circle', 'square', 'triangle', 'diamond'] }).notNull().default('circle'),
  customIconUri: text('custom_icon_uri'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_map_keys_map_id').on(table.mapId),
])

export const mapMarkers = pgTable('map_markers', {
  id: uuid('id').primaryKey().defaultRandom(),
  mapId: uuid('map_id').notNull().references(() => maps.id, { onDelete: 'cascade' }),
  keyId: uuid('key_id').notNull().references(() => mapKeys.id, { onDelete: 'cascade' }),
  x: real('x').notNull().default(0),
  y: real('y').notNull().default(0),
  label: text('label').notNull().default(''),
  description: text('description').notNull().default(''),
  status: text('status', { enum: ['active', 'resolved', 'flagged'] }).notNull().default('active'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_map_markers_map_id').on(table.mapId),
  index('idx_map_markers_key_id').on(table.keyId),
])

export const markerPhotos = pgTable('marker_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  markerId: uuid('marker_id').notNull().references(() => mapMarkers.id, { onDelete: 'cascade' }),
  fileUri: text('file_uri').notNull().default(''),
  fileName: text('file_name').notNull().default(''),
  fileSize: integer('file_size').notNull().default(0),
  caption: text('caption').notNull().default(''),
  takenAt: timestamp('taken_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_marker_photos_marker_id').on(table.markerId),
])
