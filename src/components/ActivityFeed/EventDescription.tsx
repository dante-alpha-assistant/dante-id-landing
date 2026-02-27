import React from 'react'
import { EventType } from '../../types/activity'

interface EventDescriptionProps {
  description: string
  eventType: EventType
  metadata: Record<string, any>
}

export default function EventDescription({ description, eventType, metadata }: EventDescriptionProps) {
  return (
    <div className="text-sm text-gray-700">
      <p>{description}</p>
      {metadata && Object.keys(metadata).length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          {metadata.branch && <span className="mr-2">Branch: {metadata.branch}</span>}
          {metadata.commit && <span className="mr-2">Commit: {metadata.commit.slice(0, 8)}</span>}
          {metadata.pr_number && <span className="mr-2">PR #{metadata.pr_number}</span>}
          {metadata.author && <span className="mr-2">by {metadata.author}</span>}
          {metadata.duration && <span className="mr-2">Duration: {metadata.duration}</span>}
          {metadata.test_count && <span className="mr-2">{metadata.test_count} tests</span>}
        </div>
      )}
    </div>
  )
}