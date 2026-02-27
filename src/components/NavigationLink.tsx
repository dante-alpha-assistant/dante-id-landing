import { Link } from 'react-router-dom'

interface NavigationLinkProps {
  href: string
  label: string
  isActive?: boolean
  onClick?: () => void
  className?: string
}

export default function NavigationLink({ href, label, isActive, onClick, className = '' }: NavigationLinkProps) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={`text-sm font-medium transition-colors hover:text-md-primary ${
        isActive 
          ? 'text-md-primary border-b-2 border-md-primary pb-1'
          : 'text-gray-700'
      } ${className}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </Link>
  )
}