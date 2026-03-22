// Shared types for SiteMap

export interface Project {
  id: string;
  name: string;
  description: string;
  address: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SiteMap {
  id: string;
  project_id: string;
  name: string;
  description: string;
  file_type: 'pdf' | 'image';
  file_uri: string;
  file_name: string;
  file_size: number;
  width: number;
  height: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MapKey {
  id: string;
  map_id: string;
  label: string;
  icon_name: string;
  icon_color: string;
  icon_shape: 'circle' | 'square' | 'triangle' | 'diamond';
  custom_icon_uri: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MapMarker {
  id: string;
  map_id: string;
  key_id: string;
  x: number;
  y: number;
  label: string;
  description: string;
  status: 'active' | 'resolved' | 'flagged';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MarkerPhoto {
  id: string;
  marker_id: string;
  file_uri: string;
  file_name: string;
  file_size: number;
  caption: string;
  taken_at: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'inspector' | 'viewer';
  created_at: string;
  updated_at: string;
}

export type MarkerStatus = MapMarker['status'];
export type IconShape = MapKey['icon_shape'];
export type FileType = SiteMap['file_type'];
