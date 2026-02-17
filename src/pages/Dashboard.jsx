import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const statusColors = {
  pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
}

const statusLabels = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) {
          navigate('/onboarding')
        } else {
          setProject(data)
        }
        setLoading(false)
      })
  }, [user, navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!project) return null

  const status = project.status || 'pending'
  const needs = Array.isArray(project.needs) ? project.needs : []

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
        <span className="text-xl font-bold tracking-tight">dante.</span>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto mt-16 px-4">
        <h1 className="text-2xl font-semibold mb-8">
          Welcome, {project.full_name || 'there'}
        </h1>

        {/* Project card */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
          {project.company_name && (
            <div className="text-lg font-medium">{project.company_name}</div>
          )}

          {project.idea && (
            <p className="text-gray-400 text-sm leading-relaxed">
              {project.idea.length > 200 ? project.idea.slice(0, 200) + '…' : project.idea}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {project.stage && (
              <span className="rounded-full px-3 py-1 text-sm bg-white/10 text-gray-300">
                {project.stage}
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-sm ${statusColors[status] || statusColors.pending}`}>
              {statusLabels[status] || 'Pending'}
            </span>
          </div>

          {needs.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {needs.map((need) => (
                <span key={need} className="rounded-full px-3 py-1 text-xs bg-white/5 text-gray-400 border border-[#333]">
                  {need}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Assembling message */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 animate-pulse">
            ✨ Your AI team is being assembled... We'll notify you when your deliverables are ready.
          </p>
        </div>
      </div>
    </div>
  )
}
