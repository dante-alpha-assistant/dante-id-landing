import { useParams } from 'react-router-dom';
import { ActivityFeed } from '../components/ActivityFeed/ActivityFeed';
import { useProject } from '../hooks/useProject';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { project, loading, error } = useProject(id!);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading project</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-gray-600">
          Recent activity for this project
        </p>
      </div>
      
      <ActivityFeed
        projectId={id}
        refreshInterval={30000}
        maxItems={50}
        enableAutoRefresh={true}
      />
    </div>
  );
}