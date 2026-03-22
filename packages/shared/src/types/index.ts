// Re-export all types and enums from the canonical schema source
// This file exists for backward compatibility with the '@sitemap/shared/types' import path
export type {
  User,
  UserRole,
  Facility,
  Project,
  SiteMap,
  MapKey,
  MapMarker,
  MarkerPhoto,
  MarkerStatus,
  IconShape,
  FileType,
  UserFacility,
  Teammate,
  TeammateRole,
} from '../schema';
