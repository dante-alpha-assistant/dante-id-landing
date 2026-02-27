-- Mobile preferences table
CREATE TABLE mobile_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  touch_target_size INTEGER DEFAULT 44,
  animation_enabled BOOLEAN DEFAULT true,
  haptic_feedback BOOLEAN DEFAULT true,
  data_saver_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mobile analytics table
CREATE TABLE mobile_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  viewport_width INTEGER NOT NULL,
  viewport_height INTEGER NOT NULL,
  interaction_type TEXT CHECK (interaction_type IN ('touch', 'scroll', 'swipe', 'pinch')),
  component_id TEXT NOT NULL,
  performance_score DECIMAL(4,2) CHECK (performance_score >= 0 AND performance_score <= 100),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Add mobile optimized columns to activity_log
ALTER TABLE activity_log 
ADD COLUMN mobile_optimized_data JSONB DEFAULT '{}',
ADD COLUMN touch_priority INTEGER DEFAULT 1 CHECK (touch_priority BETWEEN 1 AND 3),
ADD COLUMN compressed_description TEXT;

-- Enable RLS
ALTER TABLE mobile_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their mobile preferences" 
ON mobile_preferences 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their analytics data" 
ON mobile_analytics 
FOR ALL 
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_mobile_analytics_user_timestamp ON mobile_analytics(user_id, timestamp DESC);
CREATE INDEX idx_mobile_analytics_viewport ON mobile_analytics(viewport_width, viewport_height);
CREATE INDEX idx_activity_log_mobile_priority ON activity_log(touch_priority, timestamp DESC);
CREATE INDEX idx_mobile_preferences_user ON mobile_preferences(user_id);