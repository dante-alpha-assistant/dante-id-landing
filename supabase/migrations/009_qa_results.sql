CREATE TABLE IF NOT EXISTS qa_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  repo_full_name TEXT NOT NULL,
  pr_number INTEGER,
  commit_sha TEXT,
  status TEXT CHECK (status IN ('pending', 'running', 'success', 'failure', 'cancelled')),
  lint_status TEXT,
  build_status TEXT,
  test_status TEXT,
  test_summary JSONB,
  screenshots TEXT[],
  console_errors TEXT[],
  github_run_id BIGINT,
  github_run_url TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qa_results_project ON qa_results(project_id);
CREATE INDEX idx_qa_results_status ON qa_results(status);

ALTER TABLE qa_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own qa results" ON qa_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = qa_results.project_id AND projects.user_id = auth.uid())
);