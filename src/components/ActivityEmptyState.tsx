import React from 'react'

type ActivityEmptyStateProps = {
  hasFilters: boolean
  onClearFilters: () => void
}

export default function ActivityEmptyState({ hasFilters, onClearFilters }: ActivityEmptyStateProps) {
  return (
    <div className="bg-white shadow rounded-lg p-8 text-center">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <h3 className="mt-2 text-lg font-medium text-gray-900">
        {hasFilters ? 'No matching activities' : 'No recent activity'}
      </h3>
      <p className="mt-1 text-gray-500">
        {hasFilters 
          ? 'Try adjusting your filters to see more results.'
          : 'Activity will appear here as your projects are updated.'
        }
      </p>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}