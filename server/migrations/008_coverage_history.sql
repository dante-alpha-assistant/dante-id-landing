CREATE TABLE IF NOT EXISTS coverage_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  feature_id uuid,
  coverage_pct numeric NOT NULL,
  recorded_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coverage_project ON coverage_history(project_id, recorded_at DESC);
