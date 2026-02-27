// Placeholder: LoadingSpinner (auto-inlined);

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  lastRefresh: Date | null;
  error: string | null;
  onRetry: () => void;
}

export function RefreshIndicator({ isRefreshing, lastRefresh, error, onRetry }: RefreshIndicatorProps) {
  if (error) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-red-600">Refresh failed</span>
        <button
          onClick={onRetry}
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isRefreshing) {
    return (
      <div className="flex items-center space-x-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-600">Refreshing...</span>
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-500">
      {lastRefresh ? (
        <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
      ) : (
        <span>Auto-refresh enabled</span>
      )}
    </div>
  );
}
function LoadingSpinner(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[LoadingSpinner]</div>; }
