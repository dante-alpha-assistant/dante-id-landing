-- Enhanced migration for system theme detection

-- User preferences table for theme settings
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_preference VARCHAR(20) NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  disable_transitions BOOLEAN NOT NULL DEFAULT FALSE,
  system_preference_detected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Theme detection events for analytics
CREATE TABLE IF NOT EXISTS theme_detection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_theme VARCHAR(20) NOT NULL CHECK (detected_theme IN ('light', 'dark')),
  user_agent TEXT,
  supports_prefers_color_scheme BOOLEAN NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_detection_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for theme_detection_events (more permissive for analytics)
CREATE POLICY "Anyone can insert theme events" ON theme_detection_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own events" ON theme_detection_events
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_theme ON user_preferences(theme_preference);
CREATE INDEX idx_theme_events_timestamp ON theme_detection_events(timestamp);
CREATE INDEX idx_theme_events_detected_theme ON theme_detection_events(detected_theme);
CREATE INDEX idx_theme_events_user_id ON theme_detection_events(user_id);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_preferences
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();