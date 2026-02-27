import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EventTypeOption } from '../types/filters';

const EVENT_TYPE_CONFIGS = {
  pipeline_started: { label: 'Pipeline Started', icon: 'play' },
  pipeline_completed: { label: 'Pipeline Completed', icon: 'check-circle' },
  deployment_success: { label: 'Deployment Success', icon: 'upload' },
  deployment_failed: { label: 'Deployment Failed', icon: 'x-circle' },
  pr_created: { label: 'PR Created', icon: 'git-pull-request' },
  pr_merged: { label: 'PR Merged', icon: 'git-merge' },
  test_passed: { label: 'Test Passed', icon: 'check' },
  test_failed: { label: 'Test Failed', icon: 'x' },
  build_completed: { label: 'Build Completed', icon: 'package' }
};

export function useEventTypeOptions() {
  const [eventTypes, setEventTypes] = useState<EventTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEventTypes() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
          .from('activity_log')
          .select('event_type')
          .eq('user_id', user.id);

        if (error) throw error;

        // Count occurrences of each event type
        const typeCounts: Record<string, number> = {};
        data?.forEach(item => {
          typeCounts[item.event_type] = (typeCounts[item.event_type] || 0) + 1;
        });

        const eventTypeOptions = Object.entries(typeCounts).map(([type, count]) => ({
          type,
          count,
          label: EVENT_TYPE_CONFIGS[type as keyof typeof EVENT_TYPE_CONFIGS]?.label || type,
          icon: EVENT_TYPE_CONFIGS[type as keyof typeof EVENT_TYPE_CONFIGS]?.icon || 'circle'
        }));

        setEventTypes(eventTypeOptions.sort((a, b) => b.count - a.count));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEventTypes();
  }, []);

  return { eventTypes, loading, error };
}