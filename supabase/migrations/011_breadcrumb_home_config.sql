-- Breadcrumb home configuration migration
-- This extends the existing breadcrumb_config table with home link settings

-- Check if breadcrumb_config table exists, if not create it
CREATE TABLE IF NOT EXISTS breadcrumb_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  home_route VARCHAR(255) NOT NULL DEFAULT '/dashboard',
  home_label VARCHAR(100) NOT NULL DEFAULT 'Home',
  home_icon VARCHAR(50) DEFAULT 'home',
  max_depth INTEGER DEFAULT 5,
  show_icons BOOLEAN DEFAULT true,
  separator_type VARCHAR(20) DEFAULT 'chevron',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id)
);

-- Create breadcrumb_labels table if not exists
CREATE TABLE IF NOT EXISTS breadcrumb_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES breadcrumb_config(id) ON DELETE CASCADE,
  route_segment VARCHAR(255) NOT NULL,
  custom_label VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  order_priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(config_id, route_segment)
);

-- Create breadcrumb_analytics table for tracking breadcrumb clicks
CREATE TABLE IF NOT EXISTS breadcrumb_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  clicked_segment VARCHAR(255) NOT NULL,
  source_route TEXT NOT NULL,
  target_route TEXT NOT NULL,
  session_id UUID NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_breadcrumb_config_tenant ON breadcrumb_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_breadcrumb_labels_segment ON breadcrumb_labels(route_segment);
CREATE INDEX IF NOT EXISTS idx_breadcrumb_labels_config_segment ON breadcrumb_labels(config_id, route_segment);
CREATE INDEX IF NOT EXISTS idx_breadcrumb_analytics_user_date ON breadcrumb_analytics(user_id, clicked_at);

-- Enable Row Level Security
ALTER TABLE breadcrumb_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE breadcrumb_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE breadcrumb_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for breadcrumb_config
CREATE POLICY "Users can view their own breadcrumb config" ON breadcrumb_config
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own breadcrumb config" ON breadcrumb_config
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own breadcrumb config" ON breadcrumb_config
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own breadcrumb config" ON breadcrumb_config
  FOR DELETE USING (tenant_id = auth.uid());

-- RLS Policies for breadcrumb_labels
CREATE POLICY "Users can view their own breadcrumb labels" ON breadcrumb_labels
  FOR SELECT USING (
    config_id IN (
      SELECT id FROM breadcrumb_config WHERE tenant_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own breadcrumb labels" ON breadcrumb_labels
  FOR INSERT WITH CHECK (
    config_id IN (
      SELECT id FROM breadcrumb_config WHERE tenant_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own breadcrumb labels" ON breadcrumb_labels
  FOR UPDATE USING (
    config_id IN (
      SELECT id FROM breadcrumb_config WHERE tenant_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own breadcrumb labels" ON breadcrumb_labels
  FOR DELETE USING (
    config_id IN (
      SELECT id FROM breadcrumb_config WHERE tenant_id = auth.uid()
    )
  );

-- RLS Policies for breadcrumb_analytics
CREATE POLICY "Users can view their own breadcrumb analytics" ON breadcrumb_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own breadcrumb analytics" ON breadcrumb_analytics
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_breadcrumb_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_breadcrumb_config_timestamp
  BEFORE UPDATE ON breadcrumb_config
  FOR EACH ROW
  EXECUTE FUNCTION update_breadcrumb_config_updated_at();