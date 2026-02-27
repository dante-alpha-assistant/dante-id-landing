CREATE TABLE IF NOT EXISTS self_improve_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion text,
  github_issue_url text,
  project_id uuid,
  status text DEFAULT 'pending',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  result jsonb
);
