import React, { useState, useEffect, useCallback } from 'react';
// Placeholder: MobileActivityItem (auto-inlined);
// Placeholder: MobileFilterSheet (auto-inlined);
// Placeholder: PullToRefreshIndicator (auto-inlined);
// Placeholder: VirtualizedList (auto-inlined);
// Placeholder: TouchableIcon (auto-inlined);
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { MobileOptimizedActivity } from '../../types/mobile';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

export function MobileActivityFeed() {
  const [activities, setActivities] = useState<MobileOptimizedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [useVirtualization, setUseVirtualization] = useState(false);
  const { user } = useAuth();
  const { lightImpact } = useHapticFeedback();

  const [filters, setFilters] = useState({
    eventTypes: [
      { id: 'deployment', label: 'Deployment', selected: false },
      { id: 'pull_request', label: 'Pull Request', selected: false },
      { id: 'pipeline', label: 'Pipeline', selected: false },
      { id: 'merge', label: 'Merge', selected: false }
    ],
    priorities: [
      { id: 'high', label: 'High', selected: false },
      { id: 'medium', label: 'Medium', selected: false },
      { id: 'low', label: 'Low', selected: false }
    ]
  });

  const fetchActivities = useCallback(async () => {
    if (!user) return;
    
    try {
      setError(null);
      
      let query = supabase
        .from('activity_log')
        .select(`
          *,
          project:projects(id, name)
        `)
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      // Apply filters
      const selectedEventTypes = filters.eventTypes
        .filter(f => f.selected)
        .map(f => f.id);
      
      const selectedPriorities = filters.priorities
        .filter(f => f.selected)
        .map(f => f.id);

      if (selectedEventTypes.length > 0) {
        query = query.in('event_type', selectedEventTypes);
      }
      
      if (selectedPriorities.length > 0) {
        query = query.in('touch_priority', selectedPriorities.map(p => 
          p === 'high' ? 3 : p === 'medium' ? 2 : 1
        ));
      }

      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      // Transform data for mobile
      const mobileData: MobileOptimizedActivity[] = (data || []).map(activity => ({
        id: activity.id,
        icon: activity.event_type,
        project: {
          id: activity.project?.id || '',
          name: activity.project?.name || 'Unknown Project',
          short_name: activity.project?.name?.substring(0, 20) || 'Unknown'
        },
        priority: activity.touch_priority === 3 ? 'high' : 
                 activity.touch_priority === 2 ? 'medium' : 'low',
        timestamp: activity.timestamp,
        event_type: activity.event_type,
        description: activity.description,
        touch_priority: activity.touch_priority || 1,
        compressed_description: activity.compressed_description
      }));
      
      setActivities(mobileData);
      
      // Enable virtualization for large datasets
      setUseVirtualization(mobileData.length > 20);
      
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleRefresh = async () => {
    await fetchActivities();
  };

  const handleFilterToggle = () => {
    lightImpact();
    setShowFilters(true);
  };

  const renderActivityItem = (activity: MobileOptimizedActivity, index: number) => (
    <MobileActivityItem
      key={activity.id}
      activity={activity}
      className="mx-4 mb-3"
    />
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-600 font-medium">Error loading activities</p>
        <p className="text-gray-500 text-sm mt-1">{error}</p>
        <button
          onClick={fetchActivities}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Recent Activity Feed</h1>
        <TouchableIcon
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
          }
          onClick={handleFilterToggle}
          accessibilityLabel="Filter activities"
        />
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-hidden">
        <PullToRefreshIndicator onRefresh={handleRefresh}>
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
              <p className="text-gray-500 text-sm max-w-xs">
                Your recent pipeline runs, PRs, and deployments will appear here.
              </p>
            </div>
          ) : useVirtualization ? (
            <VirtualizedList
              items={activities}
              itemHeight={120}
              containerHeight={window.innerHeight - 120}
              renderItem={renderActivityItem}
              className="px-0 pt-4"
            />
          ) : (
            <div className="pt-4 pb-4">
              {activities.map((activity, index) => renderActivityItem(activity, index))}
            </div>
          )}
        </PullToRefreshIndicator>
      </div>

      {/* Filter Sheet */}
      <MobileFilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setLoading(true);
        }}
      />
    </div>
  );
}
function MobileActivityItem(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[MobileActivityItem]</div>; }

function MobileFilterSheet(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[MobileFilterSheet]</div>; }

function PullToRefreshIndicator(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[PullToRefreshIndicator]</div>; }

function VirtualizedList(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[VirtualizedList]</div>; }

function TouchableIcon(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[TouchableIcon]</div>; }
