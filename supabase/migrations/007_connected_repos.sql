-- Connected Repos Table
-- Stores user-connected GitHub repositories for QA automation

CREATE TABLE IF NOT EXISTS connected_repos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_repo_id BIGINT NOT NULL,
  full_name TEXT NOT NULL,
  webhook_id BIGINT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connected_repos_user_id ON connected_repos(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_connected_repos_user_repo ON connected_repos(user_id, github_repo_id);
CREATE INDEX IF NOT EXISTS idx_connected_repos_enabled ON connected_repos(user_id, enabled) WHERE enabled = true;

-- Row Level Security
ALTER TABLE connected_repos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own connected repos"
  ON connected_repos FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own connected repos"
  ON connected_repos FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own connected repos"
  ON connected_repos FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own connected repos"
  ON connected_repos FOR DELETE
  USING (user_id = auth.uid());

-- Updated at trigger
CREATE TRIGGER update_connected_repos_updated_at
  BEFORE UPDATE ON connected_repos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
