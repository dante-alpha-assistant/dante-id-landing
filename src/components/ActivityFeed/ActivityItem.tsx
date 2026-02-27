import { useState } from 'react';
import { Link } from 'react-router-dom';
// Placeholder: EventIcon (auto-inlined);
// Placeholder: Timestamp (auto-inlined);
import { Activity } from '../../types/activity';

interface ActivityItemProps {
  activity: Activity;
  isNew?: boolean;
}

export function ActivityItem({ activity, isNew = false }: ActivityItemProps) {
  const [isAnimating, setIsAnimating] = useState(isNew);

  useState(() => {
    if (isNew) {
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  });

  return (
    <div 
      className={`p-4 hover:bg-gray-50 transition-colors ${
        isAnimating ? 'bg-blue-50 border-l-4 border-blue-400' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <EventIcon eventType={activity.event_type} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link
                to={`/project/${activity.project_id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {activity.project_name}
              </Link>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 capitalize">
                {activity.event_type.replace('_', ' ')}
              </span>
            </div>
            <Timestamp timestamp={activity.timestamp} />
          </div>
          
          <p className="mt-1 text-sm text-gray-700">
            {activity.description}
          </p>
          
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div className="mt-2">
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">
                  View details
                </summary>
                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(activity.metadata, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function EventIcon(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[EventIcon]</div>; }

function Timestamp(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[Timestamp]</div>; }
