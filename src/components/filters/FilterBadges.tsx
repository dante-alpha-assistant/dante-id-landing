import { FilterState, ProjectOption, EventTypeOption } from '../../types/filters';

interface FilterBadgesProps {
  filters: FilterState;
  projects: ProjectOption[];
  eventTypes: EventTypeOption[];
  onRemoveFilter: (key: keyof FilterState, value?: string) => void;
  onClearAll: () => void;
}

export function FilterBadges({ 
  filters, 
  projects, 
  eventTypes, 
  onRemoveFilter, 
  onClearAll 
}: FilterBadgesProps) {
  const hasFilters = filters.projectIds.length > 0 || 
    filters.eventTypes.length > 0 || 
    filters.searchQuery.length > 0;

  if (!hasFilters) return null;

  const getProjectName = (id: string) => 
    projects.find(p => p.id === id)?.name || id;

  const getEventTypeLabel = (type: string) => 
    eventTypes.find(et => et.type === type)?.label || type;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Project filters */}
      {filters.projectIds.map(projectId => (
        <span
          key={`project-${projectId}`}
          className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
        >
          Project: {getProjectName(projectId)}
          <button
            onClick={() => onRemoveFilter('projectIds', projectId)}
            className="ml-1 hover:text-blue-600"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </span>
      ))}

      {/* Event type filters */}
      {filters.eventTypes.map(eventType => (
        <span
          key={`event-${eventType}`}
          className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
        >
          {getEventTypeLabel(eventType)}
          <button
            onClick={() => onRemoveFilter('eventTypes', eventType)}
            className="ml-1 hover:text-green-600"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </span>
      ))}

      {/* Search query filter */}
      {filters.searchQuery && (
        <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
          Search: "{filters.searchQuery}"
          <button
            onClick={() => onRemoveFilter('searchQuery')}
            className="ml-1 hover:text-purple-600"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </span>
      )}

      {/* Clear all button */}
      <button
        onClick={onClearAll}
        className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
      >
        Clear all filters
      </button>
    </div>
  );
}