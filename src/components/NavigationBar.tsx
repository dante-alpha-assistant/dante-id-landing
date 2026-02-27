import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
// Placeholder: ThemeToggle (auto-inlined)

export default function NavigationBar() {
  const { signOut } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="text-xl font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              Dark Mode Test
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/settings/appearance"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Settings
            </Link>
            
            <ThemeToggle />
            
            <button
              onClick={signOut}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
function ThemeToggle(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ThemeToggle]</div>; }
