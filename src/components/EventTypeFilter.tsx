import React, { useState } from 'react'

type EventType = {
  key: string
  label: string
}

type EventTypeFilterProps = {
  eventTypes: EventType[]
  selectedTypes: string[]
  onChange: (selectedTypes: string[]) => void
}

export default function EventTypeFilter({ eventTypes, selectedTypes, onChange }: EventTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleEventType = (eventType: string) => {
    const newSelection = selectedTypes.includes(eventType)
      ? selectedTypes.filter(type => type !== eventType)
      : [...selectedTypes, eventType]
    
    onChange(newSelection)
  }

  const selectedTypeLabels = eventTypes
    .filter(et => selectedTypes.includes(et.key))
    .map(et => et.label)
    .join(', ')

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Event Types
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
      >
        {selectedTypes.length === 0 
          ? 'All event types' 
          : selectedTypes.length === 1
            ? selectedTypeLabels
            : `${selectedTypes.length} types selected`
        }
        <span className="float-right">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          {eventTypes.map((eventType) => (
            <label
              key={eventType.key}
              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedTypes.includes(eventType.key)}
                onChange={() => toggleEventType(eventType.key)}
                className="mr-2 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="text-sm text-gray-900">{eventType.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}