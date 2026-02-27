import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ProjectOption } from '../types/filters';

export function useProjectOptions() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', user.id);

        if (error) throw error;

        // Get activity counts for each project
        const projectsWithCounts = await Promise.all(
          (data || []).map(async (project) => {
            const { count } = await supabase
              .from('activity_log')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', project.id)
              .eq('user_id', user.id);

            return {
              ...project,
              activity_count: count || 0
            };
          })
        );

        setProjects(projectsWithCounts);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return { projects, loading, error };
}