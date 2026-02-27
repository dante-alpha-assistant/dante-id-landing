-- Migration: Add user_interactions table for analytics tracking
-- This table will store back-to-top button clicks and other user interactions

CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  page_url VARCHAR(500) NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('back_to_top_click', 'page_scroll', 'button_hover')),
  scroll_position INTEGER NOT NULL DEFAULT 0,
  session_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_timestamp 
  ON user_interactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_interactions_page_type 
  ON user_interactions(page_url, interaction_type);

CREATE INDEX IF NOT EXISTS idx_user_interactions_session 
  ON user_interactions(session_id, created_at);

-- RLS Policy
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own interactions
CREATE POLICY "Users can view own interactions" ON user_interactions
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own interactions
CREATE POLICY "Users can insert own interactions" ON user_interactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE user_interactions IS 'Tracks user interactions like back-to-top button clicks for analytics';