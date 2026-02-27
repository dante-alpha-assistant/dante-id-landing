import React from 'react'
import { Link } from 'react-router-dom'

interface ProjectLinkProps {
  projectId: string
  projectName: string
}

export default function ProjectLink({ projectId, projectName }: ProjectLinkProps) {
  return (
    <Link
      to={`/projects/${projectId}`}
      className="text-sm font-medium text-primary-600 hover:text-primary-500 truncate"
    >
      {projectName}
    </Link>
  )
}