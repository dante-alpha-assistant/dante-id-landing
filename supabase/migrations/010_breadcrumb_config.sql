-- Create breadcrumb_config table
CREATE TABLE IF NOT EXISTS breadcrumb_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_route VARCHAR(255) NOT NULL DEFAULT '/dashboard',
  home_label VARCHAR(100) NOT NULL DEFAULT 'Home',
  max_depth INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create route_mappings table
CREATE TABLE IF NOT EXISTS route_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES breadcrumb_config(id) ON DELETE CASCADE,
  route_segment VARCHAR(255) NOT NULL,
  display_label VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exclude_patterns table
CREATE TABLE IF NOT EXISTS exclude_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES breadcrumb_config(id) ON DELETE CASCADE,
  pattern VARCHAR(255) NOT NULL,
  pattern_type VARCHAR(20) NOT NULL DEFAULT 'exact' CHECK (pattern_type IN ('regex', 'exact')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_route_mappings_config_id ON route_mappings(config_id);
CREATE INDEX IF NOT EXISTS idx_route_mappings_segment ON route_mappings(route_segment);
CREATE INDEX IF NOT EXISTS idx_exclude_patterns_config_id ON exclude_patterns(config_id);

-- Enable RLS
ALTER TABLE breadcrumb_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclude_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies (public read for config)
CREATE POLICY "Allow public read on breadcrumb_config" ON breadcrumb_config
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated update on breadcrumb_config" ON breadcrumb_config
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow public read on route_mappings" ON route_mappings
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated update on route_mappings" ON route_mappings
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow public read on exclude_patterns" ON exclude_patterns
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated update on exclude_patterns" ON exclude_patterns
  FOR ALL USING (auth.uid() IS NOT NULL);