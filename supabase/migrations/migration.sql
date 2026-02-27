-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type varchar(50) NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create activity_read_state table
CREATE TABLE IF NOT EXISTS activity_read_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_timestamp timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_read_state ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for activity_log
CREATE POLICY "Users can view own activity" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity" ON activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity" ON activity_log
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for activity_read_state
CREATE POLICY "Users can view own read state" ON activity_read_state
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own read state" ON activity_read_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own read state" ON activity_read_state
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_activity_log_user_timestamp ON activity_log(user_id, timestamp DESC);
CREATE INDEX idx_activity_log_project_timestamp ON activity_log(project_id, timestamp DESC);
CREATE INDEX idx_activity_log_event_type ON activity_log(event_type);
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp DESC);
CREATE INDEX idx_activity_log_cleanup ON activity_log(created_at) WHERE created_at < (now() - interval '30 days');

-- Insert some sample data
INSERT INTO projects (name, description, user_id) 
SELECT 
  'Sample Project',
  'A sample project for testing',
  auth.uid()
WHERE auth.uid() IS NOT NULL;

-- Insert sample activities
INSERT INTO activity_log (project_id, user_id, event_type, description, metadata)
SELECT 
  p.id,
  p.user_id,
  'pipeline_run',
  'Pipeline started for main branch',
  '{"branch": "main", "commit": "abc123"}'
FROM projects p
WHERE p.user_id = auth.uid()
LIMIT 1;

INSERT INTO activity_log (project_id, user_id, event_type, description, metadata)
SELECT 
  p.id,
  p.user_id,
  'deployment',
  'Deployed to production environment',
  '{"environment": "production", "version": "v1.2.3"}'
FROM projects p
WHERE p.user_id = auth.uid()
LIMIT 1;

INSERT INTO activity_log (project_id, user_id, event_type, description, metadata)
SELECT 
  p.id,
  p.user_id,
  'pull_request',
  'Pull request #123 merged',
  '{"pr_number": 123, "title": "Fix critical bug"}'
FROM projects p
WHERE p.user_id = auth.uid()
LIMIT 1;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_read_state_updated_at BEFORE UPDATE ON activity_read_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();