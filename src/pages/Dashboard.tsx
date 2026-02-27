import { ActivityFeed } from '../components/ActivityFeed/ActivityFeed';

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Recent activity across your projects
        </p>
      </div>
      
      <ActivityFeed
        refreshInterval={30000}
        maxItems={50}
        enableAutoRefresh={true}
      />
    </div>
  );
}