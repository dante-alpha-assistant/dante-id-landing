-- Create accessibility preferences table
CREATE TABLE user_accessibility_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reduce_motion BOOLEAN DEFAULT FALSE,
  high_contrast BOOLEAN DEFAULT FALSE,
  screen_reader BOOLEAN DEFAULT FALSE,
  keyboard_navigation BOOLEAN DEFAULT TRUE,
  focus_indicator_style VARCHAR(50) DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create accessibility analytics table
CREATE TABLE accessibility_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  component VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  input_method VARCHAR(20) CHECK (input_method IN ('mouse', 'keyboard', 'screen_reader', 'touch')),
  page_url VARCHAR(500) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT TRUE
);

-- Create indexes for performance
CREATE INDEX idx_user_accessibility_preferences_user_id ON user_accessibility_preferences(user_id);
CREATE INDEX idx_accessibility_analytics_user_component ON accessibility_analytics(user_id, component);
CREATE INDEX idx_accessibility_analytics_timestamp ON accessibility_analytics(timestamp);

-- Enable RLS
ALTER TABLE user_accessibility_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own accessibility preferences" ON user_accessibility_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own accessibility preferences" ON user_accessibility_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own accessibility analytics" ON accessibility_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accessibility analytics" ON accessibility_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);