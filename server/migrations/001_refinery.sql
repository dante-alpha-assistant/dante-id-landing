CREATE TABLE prds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content jsonb NOT NULL DEFAULT '{}',
  version int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE features (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  prd_id uuid REFERENCES prds(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low', 'nice-to-have')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'in-progress', 'done')),
  acceptance_criteria jsonb DEFAULT '[]',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prds ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own prds" ON prds FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own features" ON features FOR ALL USING (
  EXISTS (SELECT 1 FROM prds WHERE prds.id = features.prd_id AND prds.user_id = auth.uid())
);
