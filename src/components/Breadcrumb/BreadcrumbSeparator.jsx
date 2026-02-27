import React from 'react'

const BreadcrumbSeparator = ({ 
  type = '/',
  className = ''
}) => {
  const getSeparatorIcon = () => {
    switch (type) {
      case 'chevron':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )
      case 'arrow':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )
      case 'dot':
        return '•'
      case 'slash':
      default:
        return '/'
    }
  }

  return (
    <span 
      className={`text-zinc-500 select-none ${className}`}
      aria-hidden="true"
    >
      {getSeparatorIcon()}
    </span>
  )
}

export default BreadcrumbSeparator