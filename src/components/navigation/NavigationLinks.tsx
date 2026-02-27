import React from 'react'
import { Link } from 'react-router-dom'

interface NavigationItem {
  href: string
  label: string
}

interface NavigationLinksProps {
  items: NavigationItem[]
  currentPage: string
  onClick?: () => void
}

function NavigationLinks({ items, currentPage, onClick }: NavigationLinksProps) {
  return (
    <div className="flex space-x-8">
      {items.map((item) => {
        const isActive = currentPage === item.href
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onClick}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              isActive
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

export default NavigationLinks