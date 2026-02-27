-- Migration: Add accessibility support tables
-- Description: Create tables for accessibility settings and breadcrumb labels

-- Create accessibility_settings table
CREATE TABLE IF NOT EXISTS accessibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  high_contrast_mode BOOLEAN DEFAULT FALSE,
  reduce_motion BOOLEAN DEFAULT FALSE,
  screen_reader_announcements BOOLEAN DEFAULT TRUE,
  keyboard_navigation_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one settings record per user
  CONSTRAINT unique_user_settings UNIQUE(user_id)
);

-- Create breadcrumb_labels table
CREATE TABLE IF NOT EXISTS breadcrumb_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_segment VARCHAR(255) NOT NULL UNIQUE,
  display_label VARCHAR(255) NOT NULL,
  aria_label VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accessibility_settings_user_id 
  ON accessibility_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_breadcrumb_labels_route_segment 
  ON breadcrumb_labels(route_segment);

CREATE INDEX IF NOT EXISTS idx_breadcrumb_labels_active 
  ON breadcrumb_labels(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_accessibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for accessibility_settings updated_at
CREATE TRIGGER accessibility_settings_updated_at
  BEFORE UPDATE ON accessibility_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_accessibility_updated_at();

-- Insert default breadcrumb labels
INSERT INTO breadcrumb_labels (route_segment, display_label, aria_label, description) VALUES
  ('dashboard', 'Dashboard', 'Navigate to Dashboard', 'Main project dashboard'),
  ('editor', 'Editor', 'Navigate to Editor', 'Code editor interface'),
  ('refinery', 'Refinery', 'Navigate to Refinery', 'PRD generation and refinement'),
  ('foundry', 'Foundry', 'Navigate to Foundry', 'System architecture and blueprints'),
  ('planner', 'Planner', 'Navigate to Planner', 'Work order planning and management'),
  ('builder', 'Builder', 'Navigate to Builder', 'Code generation and building'),
  ('inspector', 'Inspector', 'Navigate to Inspector', 'Quality assurance and testing'),
  ('deployer', 'Deployer', 'Navigate to Deployer', 'Application deployment'),
  ('validator', 'Validator', 'Navigate to Validator', 'Code validation and review'),
  ('iterate', 'Iterate', 'Navigate to Iterate', 'Iteration management'),
  ('usage', 'Usage', 'Navigate to Usage', 'Usage analytics and metrics'),
  ('accessibility-demo', 'Accessibility Demo', 'Navigate to Accessibility Demo', 'Demonstration of accessibility features')
ON CONFLICT (route_segment) DO NOTHING;

-- Row Level Security (RLS) policies
ALTER TABLE accessibility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE breadcrumb_labels ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own accessibility settings
CREATE POLICY "Users can manage their own accessibility settings" 
  ON accessibility_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: All authenticated users can read breadcrumb labels
CREATE POLICY "Authenticated users can read breadcrumb labels" 
  ON breadcrumb_labels
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can modify breadcrumb labels
CREATE POLICY "Service role can modify breadcrumb labels" 
  ON breadcrumb_labels
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON accessibility_settings TO authenticated;
GRANT SELECT ON breadcrumb_labels TO authenticated;
GRANT ALL ON breadcrumb_labels TO service_role;

-- Comments for documentation
COMMENT ON TABLE accessibility_settings IS 'User-specific accessibility preferences and settings';
COMMENT ON TABLE breadcrumb_labels IS 'Custom labels and ARIA labels for route segments in breadcrumb navigation';
COMMENT ON COLUMN accessibility_settings.high_contrast_mode IS 'Enable high contrast color scheme for better visibility';
COMMENT ON COLUMN accessibility_settings.reduce_motion IS 'Reduce animations and transitions for users sensitive to motion';
COMMENT ON COLUMN accessibility_settings.screen_reader_announcements IS 'Enable live region announcements for screen readers';
COMMENT ON COLUMN accessibility_settings.keyboard_navigation_enabled IS 'Enable enhanced keyboard navigation features';
COMMENT ON COLUMN breadcrumb_labels.route_segment IS 'URL segment that this label applies to';
COMMENT ON COLUMN breadcrumb_labels.display_label IS 'Human-readable label shown in the breadcrumb';
COMMENT ON COLUMN breadcrumb_labels.aria_label IS 'Accessible label for screen readers (if different from display_label)';
COMMENT ON COLUMN breadcrumb_labels.is_active IS 'Whether this label is currently active and should be used';