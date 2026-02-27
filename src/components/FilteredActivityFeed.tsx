import { useFilterState } from '../hooks/useFilterState';
import { useFilteredActivityFeed } from '../hooks/useFilteredActivityFeed';
// Placeholder: ActivityFilterPanel (auto-inlined);
// Placeholder: ActivityList (auto-inlined);
// Placeholder: LoadingSpinner (auto-inlined);
// Placeholder: EmptyState (auto-inlined);

export function FilteredActivityFeed() {
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useFilterState();
  const { activities, loading, error } = useFilteredActivityFeed(filters);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load activity feed: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Panel */}
      <ActivityFilterPanel
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
      />

      {/* Activity Feed */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            {hasActiveFilters && (
              <span className="text-sm text-gray-500">
                {activities.length} filtered result{activities.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <LoadingSpinner />
          ) : activities.length === 0 ? (
            <EmptyState 
              title={hasActiveFilters ? "No matching activities" : "No activity yet"}
              description={hasActiveFilters 
                ? "Try adjusting your filters to see more results."
                : "Activity will appear here as you work on your projects."
              }
            />
          ) : (
            <ActivityList activities={activities} />
          )}
        </div>
      </div>
    </div>
  );
}
function ActivityFilterPanel(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ActivityFilterPanel]</div>; }

function ActivityList(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ActivityList]</div>; }

function LoadingSpinner(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[LoadingSpinner]</div>; }

function EmptyState(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[EmptyState]</div>; }
