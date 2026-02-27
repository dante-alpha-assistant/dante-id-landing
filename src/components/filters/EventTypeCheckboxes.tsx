import { EventTypeOption } from '../../types/filters';
import { EventIcon } from '../ActivityFeed/EventIcon';

interface EventTypeCheckboxesProps {
  eventTypes: EventTypeOption[];
  selectedTypes: string[];
  onTypeToggle: (eventType: string) => void;
  isLoading?: boolean;
}

export function EventTypeCheckboxes({
  eventTypes,
  selectedTypes,
  onTypeToggle,
  isLoading
}: EventTypeCheckboxesProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-6 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Event Types</h3>
      <div className="space-y-1">
        {eventTypes.map((eventType) => (
          <label
            key={eventType.type}
            className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
          >
            <input
              type="checkbox"
              checked={selectedTypes.includes(eventType.type)}
              onChange={() => onTypeToggle(eventType.type)}
              className="mr-2 text-blue-600 rounded focus:ring-blue-500"
            />
            <EventIcon type={eventType.type} className="mr-2" />
            <span className="flex-1 text-sm text-gray-700">{eventType.label}</span>
            <span className="text-xs text-gray-500">({eventType.count})</span>
          </label>
        ))}
      </div>
    </div>
  );
}