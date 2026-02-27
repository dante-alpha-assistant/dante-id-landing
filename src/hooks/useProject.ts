import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project } from '../types/activity';
import { useAuth } from '../contexts/AuthContext';

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchProject() {
      if (!user || !projectId) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setProject(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch project');
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [user, projectId]);

  return { project, loading, error };
}