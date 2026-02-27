import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, ActivityResponse } from '../types/activity';
import { useAuth } from '../contexts/AuthContext';

interface UseActivityFeedProps {
  projectId?: string;
  limit?: number;
  eventType?: string;
}

export function useActivityFeed({ projectId, limit = 50, eventType }: UseActivityFeedProps = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { user } = useAuth();

  const fetchActivities = useCallback(async (isRefresh = false) => {
    if (!user) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let query = supabase
        .from('activity_log')
        .select(`
          *,
          projects!inner(name)
        `)
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const formattedActivities: Activity[] = (data || []).map((item: any) => ({
        ...item,
        project_name: item.projects?.name || 'Unknown Project'
      }));

      setActivities(formattedActivities);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, projectId, limit, eventType]);

  const checkForNewActivities = useCallback(async (): Promise<number> => {
    if (!user || !lastRefresh) return 0;

    try {
      const { count, error } = await supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gt('timestamp', lastRefresh.toISOString());

      if (error) throw error;
      return count || 0;
    } catch {
      return 0;
    }
  }, [user, lastRefresh]);

  const refresh = useCallback(() => {
    fetchActivities(true);
  }, [fetchActivities]);

  const retry = useCallback(() => {
    setError(null);
    fetchActivities(false);
  }, [fetchActivities]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    refreshing,
    lastRefresh,
    refresh,
    retry,
    checkForNewActivities
  };
}