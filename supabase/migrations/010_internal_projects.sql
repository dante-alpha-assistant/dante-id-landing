-- Internal project type support
-- Allows dante.id to build features for itself (self-building capability)

ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'internal'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS platform_context JSONB;

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
