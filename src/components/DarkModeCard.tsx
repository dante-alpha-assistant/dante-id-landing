import { ReactNode } from 'react'

interface DarkModeCardProps {
  children: ReactNode
  elevation?: 'sm' | 'md' | 'lg'
  padding?: 'sm' | 'md' | 'lg'
  bordered?: boolean
  className?: string
}

export default function DarkModeCard({
  children,
  elevation = 'md',
  padding = 'md',
  bordered = true,
  className = ''
}: DarkModeCardProps) {
  const baseClasses = 'themed-surface rounded-lg transition-all duration-200'
  
  const elevationClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  }
  
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const borderClasses = bordered ? 'themed-border border' : ''
  
  const classes = `${baseClasses} ${elevationClasses[elevation]} ${paddingClasses[padding]} ${borderClasses} ${className}`
  
  return (
    <div className={classes}>
      {children}
    </div>
  )
}