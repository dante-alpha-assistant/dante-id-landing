CREATE TABLE IF NOT EXISTS test_run_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  feature_id uuid,
  test_name text NOT NULL,
  status text NOT NULL,
  run_at timestamptz DEFAULT now(),
  category text,
  details text
);
CREATE INDEX IF NOT EXISTS idx_test_history_project ON test_run_history(project_id, test_name, run_at DESC);
