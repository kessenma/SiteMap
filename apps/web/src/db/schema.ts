import { pgTable, uuid, text, real, integer, bigint, timestamp, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core'
import {
  TABLE_NAMES,
  COLUMNS,
  userRoleEnum,
  fileTypeEnum,
  iconShapeEnum,
  markerStatusEnum,
  devicePlatformEnum,
  deviceEnvironmentEnum,
} from '@sitemap/shared/schema'

export const users = pgTable(TABLE_NAMES.users, {
  id: text(COLUMNS.users.id).primaryKey(),
  email: text(COLUMNS.users.email).notNull().unique(),
  name: text(COLUMNS.users.name).notNull().default(''),
  firstName: text(COLUMNS.users.firstName).notNull().default(''),
  lastName: text(COLUMNS.users.lastName).notNull().default(''),
  role: text(COLUMNS.users.role, { enum: userRoleEnum.options }).notNull().default('technician'),
  emailVerified: boolean(COLUMNS.users.emailVerified).notNull().default(false),
  image: text(COLUMNS.users.image),
  isActive: boolean(COLUMNS.users.isActive).notNull().default(true),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  createdAt: timestamp(COLUMNS.users.createdAt, { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp(COLUMNS.users.updatedAt, { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = pgTable(TABLE_NAMES.sessions, {
  id: text(COLUMNS.sessions.id).primaryKey(),
  userId: text(COLUMNS.sessions.userId).notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text(COLUMNS.sessions.token).notNull(),
  expiresAt: timestamp(COLUMNS.sessions.expiresAt, { withTimezone: true }).notNull(),
  ipAddress: text(COLUMNS.sessions.ipAddress),
  userAgent: text(COLUMNS.sessions.userAgent),
  createdAt: timestamp(COLUMNS.sessions.createdAt, { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp(COLUMNS.sessions.updatedAt, { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('idx_sessions_token').on(table.token),
])

export const accounts = pgTable(TABLE_NAMES.accounts, {
  id: text(COLUMNS.accounts.id).primaryKey(),
  userId: text(COLUMNS.accounts.userId).notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text(COLUMNS.accounts.accountId).notNull(),
  providerId: text(COLUMNS.accounts.providerId).notNull(),
  accessToken: text(COLUMNS.accounts.accessToken),
  refreshToken: text(COLUMNS.accounts.refreshToken),
  accessTokenExpiresAt: timestamp(COLUMNS.accounts.accessTokenExpiresAt, { withTimezone: true }),
  refreshTokenExpiresAt: timestamp(COLUMNS.accounts.refreshTokenExpiresAt, { withTimezone: true }),
  scope: text(COLUMNS.accounts.scope),
  idToken: text(COLUMNS.accounts.idToken),
  password: text(COLUMNS.accounts.password),
  createdAt: timestamp(COLUMNS.accounts.createdAt, { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp(COLUMNS.accounts.updatedAt, { withTimezone: true }).notNull().defaultNow(),
})

export const verifications = pgTable(TABLE_NAMES.verifications, {
  id: text(COLUMNS.verifications.id).primaryKey(),
  identifier: text(COLUMNS.verifications.identifier).notNull(),
  value: text(COLUMNS.verifications.value).notNull(),
  expiresAt: timestamp(COLUMNS.verifications.expiresAt, { withTimezone: true }).notNull(),
  createdAt: timestamp(COLUMNS.verifications.createdAt, { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp(COLUMNS.verifications.updatedAt, { withTimezone: true }).notNull().defaultNow(),
})

export const twoFactors = pgTable(TABLE_NAMES.twoFactors, {
  id: text(COLUMNS.twoFactors.id).primaryKey(),
  userId: text(COLUMNS.twoFactors.userId).notNull().references(() => users.id, { onDelete: 'cascade' }),
  secret: text(COLUMNS.twoFactors.secret).notNull(),
  backupCodes: text(COLUMNS.twoFactors.backupCodes).notNull(),
  enabled: boolean(COLUMNS.twoFactors.enabled).notNull().default(false),
}, (table) => [
  index('idx_two_factors_user_id').on(table.userId),
])

export const passkeyCredentials = pgTable(TABLE_NAMES.passkeyCredentials, {
  id: uuid(COLUMNS.passkeyCredentials.id).primaryKey().defaultRandom(),
  userId: text(COLUMNS.passkeyCredentials.userId).notNull().references(() => users.id, { onDelete: 'cascade' }),
  credentialId: text(COLUMNS.passkeyCredentials.credentialId).notNull().unique(),
  publicKey: text(COLUMNS.passkeyCredentials.publicKey).notNull(),
  counter: bigint(COLUMNS.passkeyCredentials.counter, { mode: 'number' }).notNull().default(0),
  deviceType: text(COLUMNS.passkeyCredentials.deviceType).notNull().default('singleDevice'),
  backedUp: boolean(COLUMNS.passkeyCredentials.backedUp).notNull().default(false),
  transports: text(COLUMNS.passkeyCredentials.transports),
  deviceName: text(COLUMNS.passkeyCredentials.deviceName),
  isActive: boolean(COLUMNS.passkeyCredentials.isActive).notNull().default(true),
  lastUsedAt: timestamp(COLUMNS.passkeyCredentials.lastUsedAt, { withTimezone: true }),
  createdAt: timestamp(COLUMNS.passkeyCredentials.createdAt, { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_passkey_user_active').on(table.userId, table.isActive),
])

export const facilities = pgTable(TABLE_NAMES.facilities, {
  id: uuid(COLUMNS.facilities.id).primaryKey().defaultRandom(),
  name: text(COLUMNS.facilities.name).notNull(),
  address: text(COLUMNS.facilities.address).notNull().default(''),
  createdAt: timestamp(COLUMNS.facilities.createdAt, { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp(COLUMNS.facilities.updatedAt, { withTimezone: true }).notNull().defaultNow(),
})

export const projects = pgTable(TABLE_NAMES.projects, {
  id: uuid(COLUMNS.projects.id).primaryKey().defaultRandom(),
  name: text(COLUMNS.projects.name).notNull(),
  description: text(COLUMNS.projects.description).notNull().default(''),
  address: text(COLUMNS.projects.address).notNull().default(''),
  createdBy: text(COLUMNS.projects.createdBy).references(() => users.id),
  createdAt: timestamp(COLUMNS.projects.createdAt, { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp(COLUMNS.projects.updatedAt, { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_projects_created_by').on(table.createdBy),
])

export const maps = pgTable(TABLE_NAMES.maps, {
  id: uuid(COLUMNS.maps.id).primaryKey().defaultRandom(),
  projectId: uuid(COLUMNS.maps.projectId).references(() => projects.id, { onDelete: 'cascade' }),
  facilityId: uuid(COLUMNS.maps.facilityId).references(() => facilities.id),
  name: text(COLUMNS.maps.name).notNull(),
  description: text(COLUMNS.maps.description).notNull().default(''),
  fileType: text(COLUMNS.maps.fileType, { enum: fileTypeEnum.options }).notNull(),
  fileUri: text(COLUMNS.maps.fileUri).notNull().default(''),
  fileName: text(COLUMNS.maps.fileName).notNull().default(''),
  fileSize: integer(COLUMNS.maps.fileSize).notNull().default(0),
  width: real(COLUMNS.maps.width).notNull().default(0),
  height: real(COLUMNS.maps.height).notNull().default(0),
  createdBy: text(COLUMNS.maps.createdBy).references(() => users.id),
  createdAt: timestamp(COLUMNS.maps.createdAt, { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp(COLUMNS.maps.updatedAt, { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_maps_project_id').on(table.projectId),
  index('idx_maps_facility_id').on(table.facilityId),
])

export const mapKeys = pgTable(TABLE_NAMES.mapKeys, {
  id: uuid(COLUMNS.mapKeys.id).primaryKey().defaultRandom(),
  mapId: uuid(COLUMNS.mapKeys.mapId).notNull().references(() => maps.id, { onDelete: 'cascade' }),
  label: text(COLUMNS.mapKeys.label).notNull(),
  iconName: text(COLUMNS.mapKeys.iconName).notNull().default(''),
  iconColor: text(COLUMNS.mapKeys.iconColor).notNull().default('#3B82F6'),
  iconShape: text(COLUMNS.mapKeys.iconShape, { enum: iconShapeEnum.options }).notNull().default('circle'),
  customIconUri: text(COLUMNS.mapKeys.customIconUri),
  sortOrder: integer(COLUMNS.mapKeys.sortOrder).notNull().default(0),
  createdAt: timestamp(COLUMNS.mapKeys.createdAt, { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp(COLUMNS.mapKeys.updatedAt, { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_map_keys_map_id').on(table.mapId),
])

export const mapMarkers = pgTable(TABLE_NAMES.mapMarkers, {
  id: uuid(COLUMNS.mapMarkers.id).primaryKey().defaultRandom(),
  mapId: uuid(COLUMNS.mapMarkers.mapId).notNull().references(() => maps.id, { onDelete: 'cascade' }),
  keyId: uuid(COLUMNS.mapMarkers.keyId).notNull().references(() => mapKeys.id, { onDelete: 'cascade' }),
  x: real(COLUMNS.mapMarkers.x).notNull().default(0),
  y: real(COLUMNS.mapMarkers.y).notNull().default(0),
  label: text(COLUMNS.mapMarkers.label).notNull().default(''),
  description: text(COLUMNS.mapMarkers.description).notNull().default(''),
  status: text(COLUMNS.mapMarkers.status, { enum: markerStatusEnum.options }).notNull().default('active'),
  createdBy: text(COLUMNS.mapMarkers.createdBy).references(() => users.id),
  createdAt: timestamp(COLUMNS.mapMarkers.createdAt, { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp(COLUMNS.mapMarkers.updatedAt, { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_map_markers_map_id').on(table.mapId),
  index('idx_map_markers_key_id').on(table.keyId),
])

export const markerPhotos = pgTable(TABLE_NAMES.markerPhotos, {
  id: uuid(COLUMNS.markerPhotos.id).primaryKey().defaultRandom(),
  markerId: uuid(COLUMNS.markerPhotos.markerId).notNull().references(() => mapMarkers.id, { onDelete: 'cascade' }),
  fileUri: text(COLUMNS.markerPhotos.fileUri).notNull().default(''),
  fileName: text(COLUMNS.markerPhotos.fileName).notNull().default(''),
  fileSize: integer(COLUMNS.markerPhotos.fileSize).notNull().default(0),
  caption: text(COLUMNS.markerPhotos.caption).notNull().default(''),
  takenAt: timestamp(COLUMNS.markerPhotos.takenAt, { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp(COLUMNS.markerPhotos.createdAt, { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_marker_photos_marker_id').on(table.markerId),
])

export const pushDevices = pgTable(TABLE_NAMES.pushDevices, {
  id: uuid(COLUMNS.pushDevices.id).primaryKey().defaultRandom(),
  userId: text(COLUMNS.pushDevices.userId).references(() => users.id, { onDelete: 'cascade' }),
  platform: text(COLUMNS.pushDevices.platform, { enum: devicePlatformEnum.options }).notNull(),
  token: text(COLUMNS.pushDevices.token).notNull(),
  environment: text(COLUMNS.pushDevices.environment, { enum: deviceEnvironmentEnum.options }).notNull().default('prod'),
  isActive: boolean(COLUMNS.pushDevices.isActive).notNull().default(true),
  lastSeenAt: timestamp(COLUMNS.pushDevices.lastSeenAt, { withTimezone: true }).notNull().defaultNow(),
  deviceId: text(COLUMNS.pushDevices.deviceId),
  deviceModel: text(COLUMNS.pushDevices.deviceModel),
  appVersion: text(COLUMNS.pushDevices.appVersion),
  buildNumber: text(COLUMNS.pushDevices.buildNumber),
  createdAt: timestamp(COLUMNS.pushDevices.createdAt, { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp(COLUMNS.pushDevices.updatedAt, { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_push_devices_user_active').on(table.userId, table.isActive),
  index('idx_push_devices_token').on(table.token),
  uniqueIndex('push_devices_token_platform_env_unique').on(table.token, table.platform, table.environment),
])
