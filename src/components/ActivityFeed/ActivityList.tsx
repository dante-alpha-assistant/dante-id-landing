// Placeholder: ActivityItem (auto-inlined);
// Placeholder: LoadingSpinner (auto-inlined);
// Placeholder: EmptyState (auto-inlined);
import { useScrollPreservation } from '../../hooks/useScrollPreservation';
import { Activity } from '../../types/activity';
import { useEffect } from 'react';

interface ActivityListProps {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ActivityList({ activities, loading, error, onRetry }: ActivityListProps) {
  const { setScrollElement, preserveScroll, restoreScroll } = useScrollPreservation();

  useEffect(() => {
    if (activities.length > 0) {
      preserveScroll();
      // Restore scroll position after render
      setTimeout(() => {
        restoreScroll();
      }, 0);
    }
  }, [activities, preserveScroll, restoreScroll]);

  if (loading && activities.length === 0) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-8">
        <EmptyState />
      </div>
    );
  }

  return (
    <div 
      ref={setScrollElement}
      className="max-h-96 overflow-y-auto"
    >
      <div className="divide-y divide-gray-100">
        {activities.map((activity, index) => (
          <ActivityItem 
            key={activity.id} 
            activity={activity}
            isNew={index === 0 && activities.length > 1}
          />
        ))}
      </div>
    </div>
  );
}
function ActivityItem(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ActivityItem]</div>; }

function LoadingSpinner(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[LoadingSpinner]</div>; }

function EmptyState(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[EmptyState]</div>; }
