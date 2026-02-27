import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ActivityItem } from '../types/activity';
import { FilterState } from '../types/filters';

export function useFilteredActivityFeed(filters: FilterState, limit = 20) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Debounce search query
  const debouncedQuery = useMemo(() => {
    const timeout = setTimeout(() => filters.searchQuery, 300);
    return () => clearTimeout(timeout);
  }, [filters.searchQuery]);

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        let query = supabase
          .from('activity_log')
          .select(`
            id,
            timestamp,
            event_type,
            description,
            metadata,
            project_id,
            projects!inner(name)
          `)
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(limit + 1);

        // Apply project filter
        if (filters.projectIds.length > 0) {
          query = query.in('project_id', filters.projectIds);
        }

        // Apply event type filter
        if (filters.eventTypes.length > 0) {
          query = query.in('event_type', filters.eventTypes);
        }

        // Apply search filter
        if (filters.searchQuery.trim()) {
          query = query.textSearch('description', filters.searchQuery.trim());
        }

        const { data, error } = await query;

        if (error) throw error;

        const items = (data || []).map(item => ({
          id: item.id,
          timestamp: item.timestamp,
          event_type: item.event_type,
          description: item.description,
          metadata: item.metadata || {},
          project_id: item.project_id,
          project_name: (item.projects as any)?.name || 'Unknown Project'
        }));

        setHasMore(items.length > limit);
        setActivities(items.slice(0, limit));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [filters.projectIds, filters.eventTypes, filters.searchQuery, limit]);

  return {
    activities,
    loading,
    error,
    hasMore
  };
}