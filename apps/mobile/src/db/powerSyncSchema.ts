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
  role: column.text, // 'admin' | 'inspector' | 'viewer'
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
    custom_icon_uri: column.text, // optional: user-uploaded custom icon
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

export const AppSchema = new Schema({
  users,
  facilities,
  projects,
  maps,
  map_keys,
  map_markers,
  marker_photos,
});

export type Database = (typeof AppSchema)['types'];
export type FacilityRecord = Database['facilities'];
export type ProjectRecord = Database['projects'];
export type MapRecord = Database['maps'];
export type MapKeyRecord = Database['map_keys'];
export type MapMarkerRecord = Database['map_markers'];
export type MarkerPhotoRecord = Database['marker_photos'];
export type UserRecord = Database['users'];
