import React from 'react'
import { useNavigate } from 'react-router-dom'
// Placeholder: EventIcon (auto-inlined)

type ActivityEvent = {
  id: string
  created_at: string
  event_type: string
  stage?: string
  description: string
  metadata: any
  severity: string
  project_id: string
  project_name?: string
}

type ActivityItemProps = {
  event: ActivityEvent
  showProject?: boolean
  onClick?: () => void
}

export default function ActivityItem({ event, showProject = true, onClick }: ActivityItemProps) {
  const navigate = useNavigate()

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const eventTime = new Date(timestamp)
    const diff = now.getTime() - eventTime.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return eventTime.toLocaleDateString()
  }

  const handleProjectClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/projects/${event.project_id}`)
  }

  return (
    <div 
      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <EventIcon 
          eventType={event.event_type} 
          severity={event.severity}
          stage={event.stage}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-900 font-medium">
                {event.description}
              </p>
              {event.stage && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {event.stage}
                </span>
              )}
            </div>
            <time className="text-xs text-gray-500 whitespace-nowrap">
              {formatTimestamp(event.created_at)}
            </time>
          </div>
          {showProject && event.project_name && (
            <button
              onClick={handleProjectClick}
              className="text-sm text-primary hover:text-blue-700 font-medium mt-1"
            >
              {event.project_name}
            </button>
          )}
          {event.metadata?.pr_number && (
            <p className="text-xs text-gray-500 mt-1">
              PR #{event.metadata.pr_number}
            </p>
          )}
          {event.metadata?.duration && (
            <p className="text-xs text-gray-500 mt-1">
              Duration: {Math.round(event.metadata.duration / 1000)}s
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
function EventIcon(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[EventIcon]</div>; }
