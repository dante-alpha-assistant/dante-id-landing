import { Link } from 'react-router-dom'

interface CTAButtonProps {
  href: string
  label: string
  variant: 'primary' | 'secondary'
  onClick?: () => void
  className?: string
}

export default function CTAButton({ href, label, variant, onClick, className = '' }: CTAButtonProps) {
  const baseClasses = 'inline-flex items-center px-6 py-2 rounded-pill text-sm font-medium transition-all duration-200 hover:shadow-md'
  
  const variantClasses = {
    primary: 'bg-md-primary text-md-on-primary hover:bg-md-primary/90',
    secondary: 'border border-md-outline text-gray-700 hover:bg-gray-50'
  }

  return (
    <Link
      to={href}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {label}
    </Link>
  )
}