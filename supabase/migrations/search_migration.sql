-- Add full-text search column to activity_log
ALTER TABLE activity_log 
ADD COLUMN IF NOT EXISTS description_vector tsvector 
GENERATED ALWAYS AS (to_tsvector('english', description)) STORED;

-- Create GIN index for efficient text search
CREATE INDEX IF NOT EXISTS idx_activity_log_description_search 
ON activity_log USING GIN(description_vector);

-- Update existing rows if needed
UPDATE activity_log SET description_vector = to_tsvector('english', description) 
WHERE description_vector IS NULL;

-- Create user filter preferences table
CREATE TABLE IF NOT EXISTS user_filter_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filter_type text NOT NULL CHECK (filter_type IN ('activity_feed')),
  preferences jsonb NOT NULL DEFAULT '{}',
  session_id text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, filter_type, session_id)
);

-- Enable RLS on user_filter_preferences
ALTER TABLE user_filter_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user_filter_preferences
CREATE POLICY "Users can manage their own filter preferences" ON user_filter_preferences
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for user_filter_preferences
CREATE INDEX IF NOT EXISTS idx_user_filter_preferences_lookup 
ON user_filter_preferences(user_id, filter_type, session_id);

CREATE INDEX IF NOT EXISTS idx_user_filter_preferences_expires 
ON user_filter_preferences(expires_at) 
WHERE expires_at IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_filter_preferences
CREATE TRIGGER update_user_filter_preferences_updated_at 
  BEFORE UPDATE ON user_filter_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();