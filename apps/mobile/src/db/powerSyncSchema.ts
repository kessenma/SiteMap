import { column, Schema, Table } from '@powersync/react-native';

/**
 * SiteMap PowerSync Schema
 *
 * Tables:
 * - facilities: Physical locations (plants, buildings, sites)
 * - projects: Manufacturing plant/site grouping
 * - maps: Uploaded PDF/image maps belonging to a facility
 * - map_keys: Custom icon legend items for a map
 * - map_markers: Locations marked on the map using a key
 * - marker_photos: Photos attached to a marker
 * - users: App users
 */

const users = new Table({
  email: column.text,
  name: column.text,
  first_name: column.text,
  last_name: column.text,
  role: column.text, // 'admin' | 'operator' | 'technician'
  image: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const facilities = new Table(
  {
    name: column.text,
    address: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
);

const projects = new Table(
  {
    name: column.text,
    description: column.text,
    address: column.text,
    created_by: column.text, // user id
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_created_by: ['created_by'] } },
);

const maps = new Table(
  {
    project_id: column.text,
    facility_id: column.text, // references facilities
    name: column.text,
    description: column.text,
    // File info: stored locally and synced as a reference
    file_type: column.text, // 'pdf' | 'image'
    file_uri: column.text, // local or remote URI
    file_name: column.text,
    file_size: column.integer,
    // Dimensions for coordinate placement
    width: column.real,
    height: column.real,
    created_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_project: ['project_id'], by_facility: ['facility_id'] } },
);

const map_keys = new Table(
  {
    map_id: column.text,
    label: column.text, // e.g. "Fire Extinguisher", "Emergency Exit"
    icon_name: column.text, // built-in icon name from lucide set
    icon_color: column.text, // hex color
    icon_shape: column.text, // 'circle' | 'square' | 'triangle' | 'diamond'
    icon_type: column.text, // 'shape' | 'image' | 'drawn' | 'text' | 'lucide'
    icon_text: column.text, // text/emoji content for 'text' type
    custom_icon_uri: column.text, // optional: user-uploaded custom icon
    marker_size: column.text, // 'sm' | 'md' | 'lg' | 'xl'
    sort_order: column.integer,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_map: ['map_id'] } },
);

const map_markers = new Table(
  {
    map_id: column.text,
    key_id: column.text, // references map_keys
    // Position on the map (percentage-based 0-100 for responsiveness)
    x: column.real,
    y: column.real,
    // Optional label override
    label: column.text,
    description: column.text,
    status: column.text, // 'active' | 'resolved' | 'flagged'
    created_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      by_map: ['map_id'],
      by_key: ['key_id'],
      by_map_key: ['map_id', 'key_id'],
    },
  },
);

const marker_photos = new Table(
  {
    marker_id: column.text,
    file_uri: column.text, // local path or remote URL
    file_name: column.text,
    file_size: column.integer,
    caption: column.text,
    taken_at: column.text,
    created_at: column.text,
  },
  { indexes: { by_marker: ['marker_id'] } },
);

// ── Map Comments ──────────────────────────────────────────────────────

const map_comments = new Table(
  {
    map_id: column.text,
    x: column.real,
    y: column.real,
    content: column.text,
    created_by: column.text,
    resolved_at: column.text,
    resolved_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_map: ['map_id'] } },
);

const comment_replies = new Table(
  {
    comment_id: column.text,
    content: column.text,
    created_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_comment: ['comment_id'] } },
);

const comment_reactions = new Table(
  {
    comment_id: column.text,
    user_id: column.text,
    emoji: column.text,
    created_at: column.text,
  },
  { indexes: { by_comment: ['comment_id'] } },
);

const comment_photos = new Table(
  {
    comment_id: column.text,
    file_uri: column.text,
    file_name: column.text,
    file_size: column.integer,
    created_at: column.text,
  },
  { indexes: { by_comment: ['comment_id'] } },
);

// ── Map Paths ─────────────────────────────────────────────────────────

const map_paths = new Table(
  {
    map_id: column.text,
    label: column.text,
    color: column.text,
    stroke_width: column.real,
    path_data: column.text, // JSON array of {x,y} points
    created_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_map: ['map_id'] } },
);

// ── Location Lists ────────────────────────────────────────────────────

const map_lists = new Table(
  {
    map_id: column.text,
    name: column.text,
    description: column.text,
    created_by: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_map: ['map_id'] } },
);

const map_list_items = new Table(
  {
    list_id: column.text,
    x: column.real,
    y: column.real,
    label: column.text,
    description: column.text,
    sort_order: column.integer,
    status: column.text, // 'pending' | 'in_progress' | 'completed'
    completed_by: column.text,
    completed_at: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_list: ['list_id'] } },
);

const list_item_photos = new Table(
  {
    list_item_id: column.text,
    file_uri: column.text,
    file_name: column.text,
    file_size: column.integer,
    caption: column.text,
    created_at: column.text,
  },
  { indexes: { by_list_item: ['list_item_id'] } },
);

// ── Service Requests ─────────────────────────────────────────────────

const service_requests = new Table(
  {
    map_id: column.text,
    x: column.real,
    y: column.real,
    category: column.text,
    description: column.text,
    status: column.text, // 'open' | 'in_progress' | 'resolved' | 'closed'
    created_by: column.text,
    resolved_by: column.text,
    resolved_at: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_map: ['map_id'], by_status: ['status'] } },
);

const service_request_photos = new Table(
  {
    service_request_id: column.text,
    file_uri: column.text,
    file_name: column.text,
    file_size: column.integer,
    created_at: column.text,
  },
  { indexes: { by_request: ['service_request_id'] } },
);

// ── User Facilities & Teammates ──────────────────────────────────────

const user_facilities = new Table(
  {
    user_id: column.text,
    facility_id: column.text,
    created_at: column.text,
  },
  { indexes: { by_user: ['user_id'], by_facility: ['facility_id'] } },
);

const teammates = new Table(
  {
    user_id: column.text,
    teammate_id: column.text,
    role: column.text, // 'team_member' | 'manager'
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { by_user: ['user_id'], by_teammate: ['teammate_id'] } },
);

/**
 * Local-Only Tables — Not synced, stored only on device
 */

// File upload queue — pending file uploads to S3 when connectivity is restored
const file_upload_queue = new Table(
  {
    // Reference to the synced record that owns this file
    table_name: column.text, // 'maps' | 'marker_photos'
    record_id: column.text, // UUID of the owning record
    column_name: column.text, // 'file_uri' — the column to update after upload
    // Local file info
    local_uri: column.text, // device file path
    file_name: column.text,
    mime_type: column.text, // e.g. 'image/jpeg', 'application/pdf'
    folder: column.text, // S3 folder, e.g. 'maps', 'marker-photos'
    // Status tracking
    status: column.text, // 'pending' | 'uploading' | 'failed'
    retry_count: column.integer,
    error: column.text,
    created_at: column.text,
    attempted_at: column.text,
  },
  {
    localOnly: true,
    indexes: {
      by_status: ['status'],
      by_record: ['table_name', 'record_id'],
    },
  },
);

// Media cache — downloaded remote files cached locally for offline viewing
const media_cache = new Table(
  {
    // id = the S3 object key (used as lookup key)
    local_path: column.text, // cached file path on device
    content_type: column.text, // MIME type
    file_size: column.integer, // original file size in bytes
    cached_at: column.text, // ISO timestamp
  },
  {
    localOnly: true,
    indexes: {
      by_cached_at: ['cached_at'],
    },
  },
);

export const AppSchema = new Schema({
  users,
  facilities,
  projects,
  maps,
  map_keys,
  map_markers,
  marker_photos,
  map_comments,
  comment_replies,
  comment_reactions,
  comment_photos,
  map_paths,
  map_lists,
  map_list_items,
  list_item_photos,
  service_requests,
  service_request_photos,
  user_facilities,
  teammates,
  // Local-only tables
  file_upload_queue,
  media_cache,
});

export type Database = (typeof AppSchema)['types'];
export type FacilityRecord = Database['facilities'];
export type ProjectRecord = Database['projects'];
export type MapRecord = Database['maps'];
export type MapKeyRecord = Database['map_keys'];
export type MapMarkerRecord = Database['map_markers'];
export type MarkerPhotoRecord = Database['marker_photos'];
export type MapCommentRecord = Database['map_comments'];
export type CommentReplyRecord = Database['comment_replies'];
export type CommentReactionRecord = Database['comment_reactions'];
export type CommentPhotoRecord = Database['comment_photos'];
export type MapPathRecord = Database['map_paths'];
export type MapListRecord = Database['map_lists'];
export type MapListItemRecord = Database['map_list_items'];
export type ListItemPhotoRecord = Database['list_item_photos'];
export type UserRecord = Database['users'];
export type UserFacilityRecord = Database['user_facilities'];
export type TeammateRecord = Database['teammates'];
export type ServiceRequestRecord = Database['service_requests'];
export type ServiceRequestPhotoRecord = Database['service_request_photos'];
export type FileUploadQueueRecord = Database['file_upload_queue'];
export type MediaCacheRecord = Database['media_cache'];
