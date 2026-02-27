import React from 'react'
import { Link } from 'react-router-dom'
import useBreadcrumb from '../../hooks/useBreadcrumb'
import { useBreadcrumbContext } from '../../contexts/BreadcrumbContext'

const Breadcrumb = ({ className = '', maxDepth, homeRoute, homeLabel }) => {
  const { config, getDisplayLabel } = useBreadcrumbContext()
  const { breadcrumbItems } = useBreadcrumb({
    maxDepth: maxDepth || config.maxDepth,
    homeRoute: homeRoute || config.homeRoute,
    homeLabel: homeLabel || config.homeLabel
  })

  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav 
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label="Breadcrumb navigation"
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1
          
          return (
            <li key={item.path} className="flex items-center">
              {index > 0 && (
                <span 
                  className="mx-2 text-zinc-500 select-none"
                  aria-hidden="true"
                >
                  {config.separator}
                </span>
              )}
              
              {isLast || item.isActive ? (
                <span 
                  className="text-md-primary font-medium"
                  aria-current="page"
                >
                  {getDisplayLabel(item.label)}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="text-zinc-400 hover:text-md-primary transition-colors duration-200 focus:outline-none focus:text-md-primary"
                  aria-label={`Navigate to ${getDisplayLabel(item.label)}`}
                >
                  {getDisplayLabel(item.label)}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb