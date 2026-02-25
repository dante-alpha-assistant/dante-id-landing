import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function ProjectList() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const STAGES = [
    { key: 'refinery', label: 'R', full: 'Refinery', route: id => `/refinery/${id}` },
    { key: 'foundry', label: 'F', full: 'Foundry', route: id => `/foundry/${id}` },
    { key: 'planner', label: 'P', full: 'Planner', route: id => `/planner/${id}` },
    { key: 'builder', label: 'B', full: 'Builder', route: id => `/builder/${id}` },
    { key: 'inspector', label: 'I', full: 'Inspector', route: id => `/inspector/${id}` },
    { key: 'deployer', label: 'D', full: 'Deployer', route: id => `/deployer/${id}` },
  ]

  const STATUS_MAP = {
    pending: { step: 0, label: 'Start', route: id => `/refinery/${id}` },
    refining: { step: 1, label: 'Refinery ✓', route: id => `/foundry/${id}` },
    designed: { step: 2, label: 'Foundry ✓', route: id => `/planner/${id}` },
    planning: { step: 3, label: 'Planner ✓', route: id => `/builder/${id}` },
    building: { step: 4, label: 'Builder ✓', route: id => `/inspector/${id}` },
    tested: { step: 5, label: 'Inspector ✓', route: id => `/deployer/${id}` },
    live: { step: 6, label: 'Live 🚀', route: id => `/dashboard/${id}` },
    completed: { step: 6, label: 'Live 🚀', route: id => `/dashboard/${id}` },
  }

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
                onClick={() => navigate((STATUS_MAP[p.status] || STATUS_MAP.pending).route(p.id))}
                className="border border-[#1f521f] p-5 text-left hover:border-[#33ff00] transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-[#33ff00] group-hover:text-[#33ff00] truncate pr-2">
                    {p.name || p.company_name || p.full_name || 'Untitled Project'}
                  </h3>
                  <span className="text-[10px] text-[#1a6b1a] whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-[#22aa00] line-clamp-2 mb-3">
                  {p.idea || p.description || 'No description'}
                </p>
                {(() => {
                  const info = STATUS_MAP[p.status] || STATUS_MAP.pending
                  return (
                    <>
                      <div className="flex items-center gap-1 mb-2">
                        {STAGES.map((s, i) => (
                          <div key={i} className="flex items-center">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] ${i < info.step ? 'bg-[#33ff00] border-[#33ff00] text-[#0a0a0a] font-bold' : i === info.step ? 'border-[#33ff00] text-[#33ff00]' : 'border-[#1f521f] text-[#1a6b1a]'}`}>
                              {s.label}
                            </div>
                            {i < STAGES.length - 1 && <div className={`w-2 h-px ${i < info.step ? 'bg-[#33ff00]' : 'bg-[#1f521f]'}`} />}
                          </div>
                        ))}
                        <span className="text-[10px] text-[#22aa00] ml-2">{info.step}/6</span>
                      </div>
                      <div className="text-[10px] text-[#33ff00]">
                        [ CONTINUE → {info.step < 6 ? STAGES[Math.min(info.step, 5)].full.toUpperCase() : 'DASHBOARD'} ]
                      </div>
                    </>
                  )
                })()}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
