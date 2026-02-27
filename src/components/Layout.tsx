import React from 'react'
import { useAuth } from '../contexts/AuthContext'
// Placeholder: NavigationBar (auto-inlined)

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {user && <NavigationBar />}
      <main className={user ? "pt-16" : ""}>
        {children}
      </main>
    </div>
  )
}
function NavigationBar(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[NavigationBar]</div>; }
