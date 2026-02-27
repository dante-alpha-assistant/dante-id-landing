import React from 'react'
import { Link } from 'react-router-dom'

const BreadcrumbItem = ({ 
  href, 
  isActive, 
  label, 
  onClick, 
  ariaCurrent = false,
  className = ''
}) => {
  const handleClick = (e) => {
    if (onClick) {
      onClick(e)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(e)
    }
  }

  if (isActive || !href) {
    return (
      <span 
        className={`text-md-primary font-medium ${className}`}
        aria-current={ariaCurrent ? 'page' : undefined}
      >
        {label}
      </span>
    )
  }

  return (
    <Link
      to={href}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`text-zinc-400 hover:text-md-primary transition-colors duration-200 focus:outline-none focus:text-md-primary ${className}`}
      aria-label={`Navigate to ${label}`}
    >
      {label}
    </Link>
  )
}

export default BreadcrumbItem