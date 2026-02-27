import React, { useState } from 'react'

type Project = {
  id: string
  name: string
}

type ProjectFilterProps = {
  projects: Project[]
  selectedProjects: string[]
  onChange: (selectedProjects: string[]) => void
}

export default function ProjectFilter({ projects, selectedProjects, onChange }: ProjectFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleProject = (projectId: string) => {
    const newSelection = selectedProjects.includes(projectId)
      ? selectedProjects.filter(id => id !== projectId)
      : [...selectedProjects, projectId]
    
    onChange(newSelection)
  }

  const selectedProjectNames = projects
    .filter(p => selectedProjects.includes(p.id))
    .map(p => p.name)
    .join(', ')

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Projects
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
      >
        {selectedProjects.length === 0 
          ? 'All projects' 
          : selectedProjects.length === 1
            ? selectedProjectNames
            : `${selectedProjects.length} projects selected`
        }
        <span className="float-right">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {projects.length === 0 ? (
            <div className="px-3 py-2 text-gray-500">No projects found</div>
          ) : (
            projects.map((project) => (
              <label
                key={project.id}
                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedProjects.includes(project.id)}
                  onChange={() => toggleProject(project.id)}
                  className="mr-2 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="text-sm text-gray-900">{project.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}