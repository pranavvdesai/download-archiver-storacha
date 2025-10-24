-- ============================================
-- PostgreSQL/Supabase Schema
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  default_space_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_default_space ON users(default_space_id);

-- ============================================
-- Table: user_settings
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  email TEXT PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
  rulesets JSONB DEFAULT '[]'::jsonb,
  ocr_enabled BOOLEAN DEFAULT true,
  max_file_size_for_ocr BIGINT DEFAULT 10485760, -- 10MB in bytes
  ocr_timeout INTEGER DEFAULT 30000, -- 30 seconds in milliseconds
  default_file_visibility TEXT DEFAULT 'private' CHECK (default_file_visibility IN ('private', 'public')),
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: spaces
-- ============================================
CREATE TABLE IF NOT EXISTS spaces (
  space_id TEXT PRIMARY KEY, -- Storacha DID: did:key:xxx
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'team')),
  owner_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for spaces
CREATE INDEX IF NOT EXISTS idx_spaces_owner ON spaces(owner_email);
CREATE INDEX IF NOT EXISTS idx_spaces_visibility ON spaces(visibility);

-- ============================================
-- Table: space_members
-- ============================================
CREATE TABLE IF NOT EXISTS space_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id TEXT NOT NULL REFERENCES spaces(space_id) ON DELETE CASCADE,
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  permissions JSONB DEFAULT '{}'::jsonb,
  UNIQUE(space_id, user_email)
);

-- Indexes for space_members
CREATE INDEX IF NOT EXISTS idx_space_members_space ON space_members(space_id);
CREATE INDEX IF NOT EXISTS idx_space_members_user ON space_members(user_email);
CREATE INDEX IF NOT EXISTS idx_space_members_role ON space_members(role);

-- ============================================
-- Table: files
-- ============================================
CREATE TABLE IF NOT EXISTS files (
  cid TEXT PRIMARY KEY, -- Content ID from Storacha
  file_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  space_id TEXT NOT NULL REFERENCES spaces(space_id) ON DELETE CASCADE,
  uploader_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  file_kind TEXT DEFAULT 'other' CHECK (file_kind IN ('document', 'image', 'video', 'audio', 'archive', 'other')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  original_url TEXT, -- Source URL if downloaded via extension
  source TEXT DEFAULT 'webapp' CHECK (source IN ('extension', 'webapp', 'api')),
  download_count INTEGER DEFAULT 0,
  shards JSONB DEFAULT '[]'::jsonb, -- Array of shard CIDs
  metadata JSONB DEFAULT '{}'::jsonb, -- Flexible additional metadata
  ocr_status TEXT DEFAULT 'not_processed' CHECK (ocr_status IN ('not_processed', 'queued', 'processing', 'completed', 'failed', 'skipped')),
  ocr_text TEXT, -- Extracted text content
  text_extraction_method TEXT CHECK (text_extraction_method IN ('embedded', 'ocr', 'none')),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Indexes for files
CREATE INDEX IF NOT EXISTS idx_files_file_id ON files(file_id);
CREATE INDEX IF NOT EXISTS idx_files_space ON files(space_id);
CREATE INDEX IF NOT EXISTS idx_files_uploader ON files(uploader_email);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON files(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_files_ocr_status ON files(ocr_status);
CREATE INDEX IF NOT EXISTS idx_files_file_kind ON files(file_kind);
CREATE INDEX IF NOT EXISTS idx_files_visibility ON files(visibility);

-- Full-text search index on OCR text
CREATE INDEX IF NOT EXISTS idx_files_ocr_text_search ON files USING GIN (to_tsvector('english', COALESCE(ocr_text, '')));

-- ============================================
-- Table: file_tags
-- ============================================
CREATE TABLE IF NOT EXISTS file_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_cid TEXT NOT NULL REFERENCES files(cid) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  added_by_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_cid, tag)
);

-- Indexes for file_tags
CREATE INDEX IF NOT EXISTS idx_file_tags_cid ON file_tags(file_cid);
CREATE INDEX IF NOT EXISTS idx_file_tags_tag ON file_tags(tag);
CREATE INDEX IF NOT EXISTS idx_file_tags_user ON file_tags(added_by_email);

-- ============================================
-- Table: events
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL, -- e.g., 'file.uploaded', 'file.downloaded', 'space.created'
  user_email TEXT REFERENCES users(email) ON DELETE SET NULL,
  space_id TEXT REFERENCES spaces(space_id) ON DELETE SET NULL,
  file_cid TEXT REFERENCES files(cid) ON DELETE SET NULL,
  payload JSONB DEFAULT '{}'::jsonb, -- Event-specific data
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_email);
CREATE INDEX IF NOT EXISTS idx_events_file ON events(file_cid);
CREATE INDEX IF NOT EXISTS idx_events_space ON events(space_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);


-- ============================================
-- Table: file_metrics_daily
-- ============================================
CREATE TABLE IF NOT EXISTS file_metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_cid TEXT NOT NULL REFERENCES files(cid) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  downloads INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  bandwidth_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_cid, metric_date)
);

-- Indexes for file_metrics_daily
CREATE INDEX IF NOT EXISTS idx_metrics_file_date ON file_metrics_daily(file_cid, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON file_metrics_daily(metric_date DESC);

-- ============================================
-- Table: sessions
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  is_valid BOOLEAN DEFAULT true,
  session_data JSONB DEFAULT '{}'::jsonb
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_valid ON sessions(is_valid) WHERE is_valid = true;

-- ============================================
-- Triggers for updated_at timestamps
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_metrics_updated_at BEFORE UPDATE ON file_metrics_daily
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all access to user_settings" ON user_settings FOR ALL USING (true);
CREATE POLICY "Allow all access to spaces" ON spaces FOR ALL USING (true);
CREATE POLICY "Allow all access to space_members" ON space_members FOR ALL USING (true);
CREATE POLICY "Allow all access to files" ON files FOR ALL USING (true);
CREATE POLICY "Allow all access to file_tags" ON file_tags FOR ALL USING (true);
CREATE POLICY "Allow all access to events" ON events FOR ALL USING (true);
CREATE POLICY "Allow all access to file_metrics_daily" ON file_metrics_daily FOR ALL USING (true);
CREATE POLICY "Allow all access to sessions" ON sessions FOR ALL USING (true);


-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count(file_cid_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE files
  SET download_count = download_count + 1
  WHERE cid = file_cid_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create daily metrics
CREATE OR REPLACE FUNCTION upsert_daily_metric(
  file_cid_param TEXT,
  metric_date_param DATE,
  downloads_param INTEGER DEFAULT 0,
  views_param INTEGER DEFAULT 0,
  shares_param INTEGER DEFAULT 0,
  bandwidth_param BIGINT DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO file_metrics_daily (file_cid, metric_date, downloads, views, shares, bandwidth_bytes)
  VALUES (file_cid_param, metric_date_param, downloads_param, views_param, shares_param, bandwidth_param)
  ON CONFLICT (file_cid, metric_date)
  DO UPDATE SET
    downloads = file_metrics_daily.downloads + EXCLUDED.downloads,
    views = file_metrics_daily.views + EXCLUDED.views,
    shares = file_metrics_daily.shares + EXCLUDED.shares,
    bandwidth_bytes = file_metrics_daily.bandwidth_bytes + EXCLUDED.bandwidth_bytes,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views for common queries
-- ============================================

-- View: Active files (not deleted)
CREATE OR REPLACE VIEW active_files AS
SELECT * FROM files WHERE deleted_at IS NULL;

-- View: User file statistics
CREATE OR REPLACE VIEW user_file_stats AS
SELECT
  uploader_email,
  COUNT(*) as total_files,
  SUM(size_bytes) as total_size_bytes,
  SUM(download_count) as total_downloads,
  MAX(uploaded_at) as last_upload_at
FROM files
WHERE deleted_at IS NULL
GROUP BY uploader_email;


COMMENT ON TABLE users IS 'User accounts and basic profile information';
COMMENT ON TABLE user_settings IS 'User-specific settings and preferences';
COMMENT ON TABLE spaces IS 'Storacha spaces (storage containers)';
COMMENT ON TABLE space_members IS 'Space membership and roles';
COMMENT ON TABLE files IS 'File metadata and OCR information';
COMMENT ON TABLE file_tags IS 'Tags associated with files';
COMMENT ON TABLE events IS 'Audit log of user and system events';
COMMENT ON TABLE file_metrics_daily IS 'Daily aggregated metrics per file';
COMMENT ON TABLE sessions IS 'User session tracking';
