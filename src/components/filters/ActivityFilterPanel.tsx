import { FilterState } from '../../types/filters';
import { useProjectOptions } from '../../hooks/useProjectOptions';
import { useEventTypeOptions } from '../../hooks/useEventTypeOptions';
// Placeholder: ProjectDropdown (auto-inlined);
// Placeholder: EventTypeCheckboxes (auto-inlined);
// Placeholder: SearchInput (auto-inlined);
// Placeholder: FilterBadges (auto-inlined);

interface ActivityFilterPanelProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onClearFilters: () => void;
}

export function ActivityFilterPanel({ 
  filters, 
  onFilterChange, 
  onClearFilters 
}: ActivityFilterPanelProps) {
  const { projects, loading: projectsLoading } = useProjectOptions();
  const { eventTypes, loading: eventTypesLoading } = useEventTypeOptions();

  const handleProjectChange = (projectIds: string[]) => {
    onFilterChange('projectIds', projectIds);
  };

  const handleEventTypeToggle = (eventType: string) => {
    const current = filters.eventTypes;
    if (current.includes(eventType)) {
      onFilterChange('eventTypes', current.filter(t => t !== eventType));
    } else {
      onFilterChange('eventTypes', [...current, eventType]);
    }
  };

  const handleSearchChange = (searchQuery: string) => {
    onFilterChange('searchQuery', searchQuery);
  };

  const handleRemoveFilter = (key: keyof FilterState, value?: string) => {
    if (key === 'searchQuery') {
      onFilterChange('searchQuery', '');
    } else if (key === 'projectIds' && value) {
      onFilterChange('projectIds', filters.projectIds.filter(id => id !== value));
    } else if (key === 'eventTypes' && value) {
      onFilterChange('eventTypes', filters.eventTypes.filter(type => type !== value));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-start gap-4 mb-4">
        {/* Project Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Projects
          </label>
          <ProjectDropdown
            projects={projects}
            selectedProjects={filters.projectIds}
            onSelectionChange={handleProjectChange}
            isLoading={projectsLoading}
          />
        </div>

        {/* Search */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <SearchInput
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search activity descriptions..."
          />
        </div>
      </div>

      {/* Event Type Filters */}
      <div className="mb-4">
        <EventTypeCheckboxes
          eventTypes={eventTypes}
          selectedTypes={filters.eventTypes}
          onTypeToggle={handleEventTypeToggle}
          isLoading={eventTypesLoading}
        />
      </div>

      {/* Filter Badges */}
      <FilterBadges
        filters={filters}
        projects={projects}
        eventTypes={eventTypes}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={onClearFilters}
      />
    </div>
  );
}
function ProjectDropdown(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ProjectDropdown]</div>; }

function EventTypeCheckboxes(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[EventTypeCheckboxes]</div>; }

function SearchInput(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[SearchInput]</div>; }

function FilterBadges(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[FilterBadges]</div>; }
