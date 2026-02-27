import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ActivityFiltersProps {
  selectedProject: string;
  selectedEventType: string;
  onFilterChange: (filters: { project: string; eventType: string }) => void;
}

interface Project {
  id: string;
  name: string;
}

const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  { value: 'pipeline_run', label: 'Pipeline Runs' },
  { value: 'pull_request', label: 'Pull Requests' },
  { value: 'deployment', label: 'Deployments' },
  { value: 'build_completed', label: 'Build Completed' },
  { value: 'build_failed', label: 'Build Failed' },
  { value: 'test_passed', label: 'Tests Passed' },
  { value: 'test_failed', label: 'Tests Failed' },
];

export function ActivityFilters({ selectedProject, selectedEventType, onFilterChange }: ActivityFiltersProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchProjects() {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name');

        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    }

    fetchProjects();
  }, [user]);

  const handleProjectChange = (projectId: string) => {
    onFilterChange({ project: projectId, eventType: selectedEventType });
  };

  const handleEventTypeChange = (eventType: string) => {
    onFilterChange({ project: selectedProject, eventType });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <label htmlFor="project-filter" className="block text-xs font-medium text-gray-700 mb-1">
          Project
        </label>
        <select
          id="project-filter"
          value={selectedProject}
          onChange={(e) => handleProjectChange(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="event-type-filter" className="block text-xs font-medium text-gray-700 mb-1">
          Event Type
        </label>
        <select
          id="event-type-filter"
          value={selectedEventType}
          onChange={(e) => handleEventTypeChange(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {EVENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {(selectedProject || selectedEventType) && (
        <div className="flex items-end">
          <button
            onClick={() => onFilterChange({ project: '', eventType: '' })}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}