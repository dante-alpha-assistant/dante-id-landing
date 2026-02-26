-- WP-1: QA Dashboard Database Migrations
-- 7 tables for the QA Dashboard feature

-- 1. qa_metrics
CREATE TABLE IF NOT EXISTS qa_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  repo_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  lint_errors INT,
  lint_warnings INT,
  build_status TEXT,
  test_total INT,
  test_passed INT,
  test_failed INT,
  test_coverage DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qa_metrics_project_id ON qa_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_qa_metrics_timestamp ON qa_metrics(timestamp);

-- 2. error_logs
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  repo_id TEXT,
  error_type TEXT CHECK (error_type IN ('lint', 'build', 'test')),
  severity TEXT CHECK (severity IN ('error', 'warning', 'info')),
  file_path TEXT,
  line_number INT,
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_error_logs_project_id ON error_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

-- 3. quality_gates
CREATE TABLE IF NOT EXISTS quality_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  max_lint_errors INT DEFAULT 0,
  min_test_coverage DECIMAL(5,2) DEFAULT 80,
  require_build_success BOOLEAN DEFAULT TRUE,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. quality_snapshots
CREATE TABLE IF NOT EXISTS quality_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  snapshot_date DATE,
  daily_avg_lint_errors DECIMAL(8,2),
  daily_build_success_rate DECIMAL(5,2),
  daily_test_pass_rate DECIMAL(5,2),
  daily_quality_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, snapshot_date)
);

-- 5. ci_triggers
CREATE TABLE IF NOT EXISTS ci_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID,
  trigger_type VARCHAR(50),
  github_run_id BIGINT,
  workflow_name VARCHAR(255),
  branch VARCHAR(255) DEFAULT 'main',
  status VARCHAR(50) DEFAULT 'pending',
  conclusion VARCHAR(50),
  trigger_inputs JSONB,
  logs_url TEXT,
  duration_seconds INT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ci_triggers_project_id ON ci_triggers(project_id);

-- 6. trigger_rate_limits
CREATE TABLE IF NOT EXISTS trigger_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  trigger_count INT DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  last_trigger TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- 7. quality_validations
CREATE TABLE IF NOT EXISTS quality_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  validation_type VARCHAR(50),
  passes_gates BOOLEAN DEFAULT FALSE,
  violations JSONB DEFAULT '[]',
  lint_errors INT,
  test_coverage DECIMAL(5,2),
  build_status VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quality_validations_project_id ON quality_validations(project_id);
