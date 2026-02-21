-- Custom Domains Table
-- Stores custom domain configurations for landing pages

CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error')),
  verification JSONB,
  dns_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_domains_project_id ON custom_domains(project_id);

-- Row Level Security
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their project domains"
  ON custom_domains FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = custom_domains.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Updated at trigger
CREATE TRIGGER update_custom_domains_updated_at
  BEFORE UPDATE ON custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
