import { useState, useEffect } from 'react';
// Placeholder: ActivityList (auto-inlined);
// Placeholder: RefreshIndicator (auto-inlined);
// Placeholder: NewActivityNotification (auto-inlined);
// Placeholder: ActivityFilters (auto-inlined);
import { useActivityFeed } from '../../hooks/useActivityFeed';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

interface ActivityFeedProps {
  projectId?: string;
  refreshInterval?: number;
  maxItems?: number;
  enableAutoRefresh?: boolean;
}

export function ActivityFeed({
  projectId,
  refreshInterval = 30000,
  maxItems = 50,
  enableAutoRefresh = true
}: ActivityFeedProps) {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [newActivityCount, setNewActivityCount] = useState(0);
  const [showNewActivities, setShowNewActivities] = useState(false);

  const {
    activities,
    loading,
    error,
    refreshing,
    lastRefresh,
    refresh,
    retry,
    checkForNewActivities
  } = useActivityFeed({
    projectId: projectId || selectedProject || undefined,
    limit: maxItems,
    eventType: selectedEventType || undefined
  });

  const handleAutoRefresh = async () => {
    const newCount = await checkForNewActivities();
    if (newCount > 0) {
      setNewActivityCount(newCount);
      setShowNewActivities(true);
    } else {
      refresh();
    }
  };

  useAutoRefresh({
    onRefresh: handleAutoRefresh,
    interval: refreshInterval,
    enabled: enableAutoRefresh && !loading
  });

  const handleShowNewActivities = () => {
    setShowNewActivities(false);
    setNewActivityCount(0);
    refresh();
  };

  const handleFilterChange = (filters: { project: string; eventType: string }) => {
    setSelectedProject(filters.project);
    setSelectedEventType(filters.eventType);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>
          <RefreshIndicator
            isRefreshing={refreshing}
            lastRefresh={lastRefresh}
            error={error}
            onRetry={retry}
          />
        </div>
        
        {!projectId && (
          <ActivityFilters
            selectedProject={selectedProject}
            selectedEventType={selectedEventType}
            onFilterChange={handleFilterChange}
          />
        )}
      </div>

      {showNewActivities && (
        <NewActivityNotification
          count={newActivityCount}
          onShow={handleShowNewActivities}
          onDismiss={() => {
            setShowNewActivities(false);
            setNewActivityCount(0);
          }}
        />
      )}

      <ActivityList
        activities={activities}
        loading={loading}
        error={error}
        onRetry={retry}
      />
    </div>
  );
}
function ActivityList(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ActivityList]</div>; }

function RefreshIndicator(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[RefreshIndicator]</div>; }

function NewActivityNotification(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[NewActivityNotification]</div>; }

function ActivityFilters(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ActivityFilters]</div>; }
