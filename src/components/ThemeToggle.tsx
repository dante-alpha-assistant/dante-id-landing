// Placeholder: useTheme (auto-inlined)

interface ThemeToggleProps {
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function ThemeToggle({ showLabel = true, size = 'md' }: ThemeToggleProps) {
  const { theme, setTheme, isDark } = useTheme()

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleToggle = () => {
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark')
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light')
    }
  }

  const getIcon = () => {
    if (theme === 'system') {
      return (
        <svg className={iconSizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    }
    
    if (isDark) {
      return (
        <svg className={iconSizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    }
    
    return (
      <svg className={iconSizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  }

  const getLabel = () => {
    if (theme === 'system') return 'Auto'
    return theme === 'light' ? 'Light' : 'Dark'
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        className={`${sizeClasses[size]} flex items-center justify-center rounded-lg themed-surface themed-border border hover:themed-bg-accent hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        title={`Current theme: ${getLabel()}`}
      >
        {getIcon()}
      </button>
      {showLabel && (
        <span className="text-sm themed-text-secondary">{getLabel()}</span>
      )}
    </div>
  )
}
function useTheme(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[useTheme]</div>; }
