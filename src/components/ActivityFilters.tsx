import React from 'react'
// Placeholder: ProjectFilter (auto-inlined)
// Placeholder: EventTypeFilter (auto-inlined)

type Project = {
  id: string
  name: string
}

type ActivityFiltersProps = {
  projects: Project[]
  activeFilters: {
    projects: string[]
    eventTypes: string[]
    search: string
  }
  onFilterChange: (filters: any) => void
}

const eventTypes = [
  { key: 'pipeline_stage', label: 'Pipeline Stages' },
  { key: 'pr_event', label: 'Pull Requests' },
  { key: 'deployment', label: 'Deployments' },
  { key: 'status_change', label: 'Status Changes' }
]

export default function ActivityFilters({ projects, activeFilters, onFilterChange }: ActivityFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...activeFilters,
      search: e.target.value
    })
  }

  const handleProjectsChange = (selectedProjects: string[]) => {
    onFilterChange({
      ...activeFilters,
      projects: selectedProjects
    })
  }

  const handleEventTypesChange = (selectedTypes: string[]) => {
    onFilterChange({
      ...activeFilters,
      eventTypes: selectedTypes
    })
  }

  const clearFilters = () => {
    onFilterChange({
      projects: [],
      eventTypes: [],
      search: ''
    })
  }

  const hasActiveFilters = activeFilters.projects.length > 0 || 
                          activeFilters.eventTypes.length > 0 || 
                          activeFilters.search.length > 0

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary hover:text-blue-700"
          >
            Clear all
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            value={activeFilters.search}
            onChange={handleSearchChange}
            placeholder="Search events..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        
        <ProjectFilter
          projects={projects}
          selectedProjects={activeFilters.projects}
          onChange={handleProjectsChange}
        />
        
        <EventTypeFilter
          eventTypes={eventTypes}
          selectedTypes={activeFilters.eventTypes}
          onChange={handleEventTypesChange}
        />
      </div>
    </div>
  )
}
function ProjectFilter(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ProjectFilter]</div>; }

function EventTypeFilter(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[EventTypeFilter]</div>; }
