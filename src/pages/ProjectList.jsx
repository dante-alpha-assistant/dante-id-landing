import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function ProjectList() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProjects(data || [])
        setLoading(false)
      })
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#33ff00] terminal-blink font-mono">[ LOADING... ]</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      {/* Header */}
      <header className="border-b border-[#1f521f] px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">dante.id <span className="text-[#22aa00] text-sm font-normal">// projects</span></h1>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#1a6b1a]">{user?.email}</span>
            <button onClick={signOut} className="text-xs text-[#22aa00] hover:text-[#33ff00] border border-[#1f521f] px-2 py-1 hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors">
              [ LOGOUT ]
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">YOUR PROJECTS</h2>
          <button
            onClick={() => navigate('/onboarding')}
            className="px-4 py-2 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors text-sm"
          >
            [ + NEW PROJECT ]
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="border border-[#1f521f] p-12 text-center">
            <p className="text-[#22aa00] mb-4">No projects yet.</p>
            <button
              onClick={() => navigate('/onboarding')}
              className="px-6 py-3 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors"
            >
              [ START YOUR FIRST PROJECT ]
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/dashboard/${p.id}`)}
                className="border border-[#1f521f] p-5 text-left hover:border-[#33ff00] transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-[#33ff00] group-hover:text-[#33ff00] truncate pr-2">
                    {p.company_name || p.full_name || 'Untitled Project'}
                  </h3>
                  <span className="text-[10px] text-[#1a6b1a] whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-[#22aa00] line-clamp-2 mb-3">
                  {p.idea || p.description || 'No description'}
                </p>
                <div className="flex gap-1">
                  {['R', 'F', 'B', 'I', 'D'].map((step, i) => (
                    <div key={i} className="w-6 h-1 bg-[#1f521f]" />
                  ))}
                </div>
                <p className="text-[10px] text-[#1a6b1a] mt-2">[ OPEN → ]</p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
