-- SiteMap Initial Schema
-- Run this against your PostgreSQL database on Hetzner

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'inspector' CHECK (role IN ('admin', 'inspector', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Facilities (physical locations: plants, buildings, sites)
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects (manufacturing plant/site)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Maps (uploaded PDF/image for a project)
CREATE TABLE maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image')),
  file_uri TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL DEFAULT '',
  file_size INTEGER NOT NULL DEFAULT 0,
  width REAL NOT NULL DEFAULT 0,
  height REAL NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Map keys (legend items with custom icons)
CREATE TABLE map_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT '',
  icon_color TEXT NOT NULL DEFAULT '#3B82F6',
  icon_shape TEXT NOT NULL DEFAULT 'circle' CHECK (icon_shape IN ('circle', 'square', 'triangle', 'diamond')),
  custom_icon_uri TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Map markers (placed on map using a key)
CREATE TABLE map_markers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  key_id UUID NOT NULL REFERENCES map_keys(id) ON DELETE CASCADE,
  x REAL NOT NULL DEFAULT 0,
  y REAL NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'flagged')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marker photos
CREATE TABLE marker_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  marker_id UUID NOT NULL REFERENCES map_markers(id) ON DELETE CASCADE,
  file_uri TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL DEFAULT '',
  file_size INTEGER NOT NULL DEFAULT 0,
  caption TEXT NOT NULL DEFAULT '',
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_maps_project_id ON maps(project_id);
CREATE INDEX idx_maps_facility_id ON maps(facility_id);
CREATE INDEX idx_map_keys_map_id ON map_keys(map_id);
CREATE INDEX idx_map_markers_map_id ON map_markers(map_id);
CREATE INDEX idx_map_markers_key_id ON map_markers(key_id);
CREATE INDEX idx_marker_photos_marker_id ON marker_photos(marker_id);

-- Enable logical replication for PowerSync
-- Run these as superuser:
-- ALTER SYSTEM SET wal_level = 'logical';
-- SELECT pg_reload_conf();

-- Create publication for PowerSync
CREATE PUBLICATION powersync_sitemap_pub FOR TABLE
  users, facilities, projects, maps, map_keys, map_markers, marker_photos;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON maps FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON map_keys FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON map_markers FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
