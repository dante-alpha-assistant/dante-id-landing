import { useState } from 'react';
import { ProjectOption } from '../../types/filters';

interface ProjectDropdownProps {
  projects: ProjectOption[];
  selectedProjects: string[];
  onSelectionChange: (projectIds: string[]) => void;
  isLoading?: boolean;
}

export function ProjectDropdown({ 
  projects, 
  selectedProjects, 
  onSelectionChange, 
  isLoading 
}: ProjectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleProject = (projectId: string) => {
    if (selectedProjects.includes(projectId)) {
      onSelectionChange(selectedProjects.filter(id => id !== projectId));
    } else {
      onSelectionChange([...selectedProjects, projectId]);
    }
  };

  if (isLoading) {
    return (
      <div className="w-48 h-10 bg-gray-100 rounded-md animate-pulse"></div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-48 px-3 py-2 bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="text-sm text-gray-700">
          {selectedProjects.length === 0
            ? 'All Projects'
            : `${selectedProjects.length} selected`}
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-64 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="max-h-60 overflow-y-auto">
            {projects.map((project) => (
              <label
                key={project.id}
                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedProjects.includes(project.id)}
                  onChange={() => toggleProject(project.id)}
                  className="mr-2 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="flex-1 text-sm text-gray-700">{project.name}</span>
                <span className="text-xs text-gray-500">({project.activity_count})</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}