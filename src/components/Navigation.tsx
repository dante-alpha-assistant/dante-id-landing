import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
// Placeholder: ThemeToggle (auto-inlined)

interface NavigationProps {
  user: any
}

export default function Navigation({ user }: NavigationProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="themed-surface themed-border border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold themed-accent">
              Dark Mode Test
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                to="/"
                className="themed-text hover:themed-accent px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                to="/settings/appearance"
                className="themed-text hover:themed-accent px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Appearance
              </Link>
              <Link
                to="/design-system"
                className="themed-text hover:themed-accent px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Design System
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle size="sm" showLabel={false} />
            <div className="flex items-center space-x-2">
              <span className="themed-text-secondary text-sm">@{user?.email?.split('@')[0]}</span>
              <button
                onClick={handleSignOut}
                className="themed-text hover:themed-accent px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
function ThemeToggle(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ThemeToggle]</div>; }
