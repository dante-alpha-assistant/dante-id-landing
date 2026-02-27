-- Create route_configurations table
CREATE TABLE IF NOT EXISTS route_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_path VARCHAR(500) NOT NULL UNIQUE,
  custom_label VARCHAR(100),
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create label_mappings table
CREATE TABLE IF NOT EXISTS label_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_key VARCHAR(100) NOT NULL UNIQUE,
  display_label VARCHAR(100) NOT NULL,
  mapping_type VARCHAR(20) NOT NULL CHECK (mapping_type IN ('abbreviation', 'acronym', 'custom')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_route_configurations_path ON route_configurations(route_path);
CREATE INDEX IF NOT EXISTS idx_label_mappings_segment ON label_mappings(segment_key);
CREATE INDEX IF NOT EXISTS idx_label_mappings_type ON label_mappings(mapping_type);

-- Insert default abbreviations
INSERT INTO label_mappings (segment_key, display_label, mapping_type) VALUES
  ('api', 'API', 'acronym'),
  ('ui', 'UI', 'acronym'),
  ('ux', 'UX', 'acronym'),
  ('db', 'Database', 'abbreviation'),
  ('auth', 'Authentication', 'abbreviation'),
  ('admin', 'Admin', 'abbreviation'),
  ('prd', 'PRD', 'acronym'),
  ('qa', 'QA', 'acronym'),
  ('github', 'GitHub', 'custom'),
  ('js', 'JavaScript', 'abbreviation'),
  ('ts', 'TypeScript', 'abbreviation'),
  ('html', 'HTML', 'acronym'),
  ('css', 'CSS', 'acronym'),
  ('sql', 'SQL', 'acronym'),
  ('json', 'JSON', 'acronym'),
  ('xml', 'XML', 'acronym'),
  ('http', 'HTTP', 'acronym'),
  ('https', 'HTTPS', 'acronym'),
  ('url', 'URL', 'acronym'),
  ('id', 'ID', 'acronym'),
  ('uuid', 'UUID', 'acronym'),
  ('oauth', 'OAuth', 'custom'),
  ('jwt', 'JWT', 'acronym')
ON CONFLICT (segment_key) DO NOTHING;

-- Enable RLS
ALTER TABLE route_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies for route_configurations (admin only)
CREATE POLICY "Allow authenticated users to read route configurations"
  ON route_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage route configurations"
  ON route_configurations FOR ALL
  TO authenticated
  USING (true);

-- RLS policies for label_mappings (read for all, admin manage)
CREATE POLICY "Allow authenticated users to read label mappings"
  ON label_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage label mappings"
  ON label_mappings FOR ALL
  TO authenticated
  USING (true);