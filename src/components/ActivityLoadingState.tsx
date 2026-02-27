import React from 'react'

type ActivityLoadingStateProps = {
  itemCount: number
}

function ActivityItemSkeleton() {
  return (
    <div className="px-6 py-4 animate-pulse">
      <div className="flex items-start space-x-3">
        <div className="w-5 h-5 bg-gray-300 rounded"></div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-4 bg-gray-300 rounded w-48"></div>
              <div className="h-5 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-3 bg-gray-300 rounded w-16"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>
        </div>
      </div>
    </div>
  )
}

export default function ActivityLoadingState({ itemCount }: ActivityLoadingStateProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: itemCount }).map((_, index) => (
          <ActivityItemSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}