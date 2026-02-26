import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function ProjectList() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [ghStatus, setGhStatus] = useState(null)
  const [deployUrls, setDeployUrls] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [qaSummaries, setQaSummaries] = useState({})

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
    live: { step: 6, label: 'Live 🚀', route: id => `/iterate/${id}` },
    completed: { step: 6, label: 'Live 🚀', route: id => `/iterate/${id}` },
  }

  useEffect(() => {
    if (!user) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetch('/api/auth/github/status', { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then(r => r.json()).then(setGhStatus).catch(() => setGhStatus({ connected: false }))
    })
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProjects(data || [])
        setLoading(false)
        ;(data || []).forEach(p => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) return
            fetch(`/api/qa/${p.id}/summary`, { headers: { Authorization: `Bearer ${session.access_token}` } })
              .then(r => r.ok ? r.json() : null)
              .then(summary => {
                if (summary) setQaSummaries(prev => ({ ...prev, [p.id]: summary }))
              })
              .catch(() => {})
          })
        })
        const liveProjects = (data || []).filter(p => p.status === 'live' || p.status === 'completed')
        if (liveProjects.length > 0) {
          supabase.from('deployments').select('project_id, url, vercel_url').in('project_id', liveProjects.map(p => p.id)).eq('status', 'live')
            .then(({ data: deps }) => {
              const urls = {}
              ;(deps || []).forEach(d => { urls[d.project_id] = d.vercel_url || d.url })
              setDeployUrls(urls)
            })
        }
      })
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-md-background flex items-center justify-center">
        <div className="text-md-primary font-sans text-lg animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-md-background text-md-on-background font-sans">
      {/* Header */}
      <header className="border-b border-md-border/20 bg-md-surface-container px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-md-on-background">dante<span className="text-md-primary">.id</span> <span className="text-md-on-surface-variant text-sm font-normal">/ projects</span></h1>
          <div className="flex items-center gap-3">
            {ghStatus?.connected ? (
              <span className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs">✓ {ghStatus.github_username}</span>
            ) : ghStatus !== null ? (
              <button onClick={async () => {
                const { data: { session } } = await supabase.auth.getSession()
                const res = await fetch('/api/auth/github/connect', { headers: { Authorization: `Bearer ${session.access_token}` } })
                const data = await res.json()
                if (data.url) window.location.href = data.url
              }} className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs hover:bg-amber-200 transition-colors">
                🔗 Connect GitHub
              </button>
            ) : null}
            <span className="text-xs text-md-on-surface-variant">{user?.email}</span>
            <button onClick={signOut} className="rounded-full bg-md-surface-variant text-md-on-surface-variant px-4 py-1.5 text-sm hover:bg-md-secondary-container transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-md-on-background">Your Projects</h2>
          <button
            onClick={() => navigate('/onboarding')}
            className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 text-sm font-medium hover:shadow-md active:scale-95 transition-all duration-300 ease-md-standard"
          >
            + New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-md-surface-container rounded-md-lg p-12 text-center shadow-sm">
            <p className="text-md-on-surface-variant mb-4 text-lg">No projects yet.</p>
            <button
              onClick={() => navigate('/onboarding')}
              className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 font-medium hover:shadow-md active:scale-95 transition-all duration-300 ease-md-standard"
            >
              Start Your First Project
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => navigate((STATUS_MAP[p.status] || STATUS_MAP.pending).route(p.id))}
                className="bg-md-surface-container rounded-md-lg p-6 text-left shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 ease-md-standard group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-md-on-background truncate pr-2">
                    {p.name || p.company_name || (p.idea && p.idea.slice(0, 40)) || 'Untitled Project'}
                  </h3>
                  <span className="text-xs text-md-on-surface-variant whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {qaSummaries[p.id] ? (
                    qaSummaries[p.id].issues === 0 || qaSummaries[p.id].passing
                      ? <span className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-0.5 text-xs">✓ Passing</span>
                      : <span className="rounded-full bg-red-100 text-red-600 px-3 py-0.5 text-xs">✗ {qaSummaries[p.id].issues || 0} issues</span>
                  ) : (
                    <span className="rounded-full bg-md-surface-variant text-md-on-surface-variant px-3 py-0.5 text-xs">No QA</span>
                  )}
                </div>
                <p className="text-sm text-md-on-surface-variant line-clamp-2 mb-3">
                  {p.idea || p.description || 'No description'}
                </p>
                {(() => {
                  const info = STATUS_MAP[p.status] || STATUS_MAP.pending
                  return (
                    <>
                      <div className="flex items-center gap-1 mb-3">
                        {STAGES.map((s, i) => (
                          <div key={i} className="flex items-center">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium ${i < info.step ? 'bg-md-primary text-md-on-primary' : i === info.step ? 'border-2 border-md-primary text-md-primary' : 'bg-md-surface-variant text-md-on-surface-variant'}`}>
                              {s.label}
                            </div>
                            {i < STAGES.length - 1 && <div className={`w-2 h-0.5 ${i < info.step ? 'bg-md-primary' : 'bg-md-surface-variant'}`} />}
                          </div>
                        ))}
                        <span className="text-xs text-md-on-surface-variant ml-2">{info.step}/6</span>
                      </div>
                      {deployUrls[p.id] && (
                        <a href={deployUrls[p.id]} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="block text-xs text-md-primary bg-md-secondary-container rounded-full px-3 py-1 mb-2 hover:bg-md-primary hover:text-md-on-primary truncate transition-colors">
                          🔗 {deployUrls[p.id]}
                        </a>
                      )}
                      <div className="flex gap-2 items-center justify-between text-xs">
                        <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-3 py-1 font-medium">
                          {info.step < 6
                            ? `Continue → ${STAGES[Math.min(info.step, 5)].full}`
                            : 'Iterate →'
                          }
                        </span>
                        <div className="flex gap-1">
                          <span
                            onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${p.id}`) }}
                            className="w-8 h-8 rounded-full bg-md-surface-variant flex items-center justify-center hover:bg-md-secondary-container transition-colors cursor-pointer"
                            title="Pipeline Timeline"
                          >📋</span>
                          <span
                            onClick={(e) => { e.stopPropagation(); navigate(`/usage/${p.id}`) }}
                            className="w-8 h-8 rounded-full bg-md-surface-variant flex items-center justify-center hover:bg-md-secondary-container transition-colors cursor-pointer"
                          >💰</span>
                          <span
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p) }}
                            className="w-8 h-8 rounded-full bg-md-surface-variant flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete Project"
                          >🗑</span>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="bg-md-background rounded-md-lg p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-red-600 font-bold text-lg mb-3">Delete Project</h3>
            <p className="text-md-on-background text-sm mb-1">
              Delete <span className="font-bold">{deleteConfirm.name || deleteConfirm.company_name || (deleteConfirm.idea && deleteConfirm.idea.slice(0, 40)) || 'Untitled'}</span>?
            </p>
            <p className="text-md-on-surface-variant text-sm mb-6">This will permanently remove the project, all features, builds, and deployments. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                disabled={deleting}
                onClick={() => setDeleteConfirm(null)}
                className="rounded-full bg-md-surface-variant text-md-on-surface-variant px-5 py-2.5 text-sm hover:bg-md-secondary-container transition-colors"
              >Cancel</button>
              <button
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    const { data: { session } } = await supabase.auth.getSession()
                    await fetch(`/api/projects/${deleteConfirm.id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${session.access_token}` },
                    })
                    setProjects(prev => prev.filter(p => p.id !== deleteConfirm.id))
                    setDeleteConfirm(null)
                  } catch (err) {
                    console.error('Delete failed:', err)
                  } finally {
                    setDeleting(false)
                  }
                }}
                className="rounded-full bg-red-500 text-white px-5 py-2.5 text-sm font-medium hover:bg-red-600 active:scale-95 transition-all duration-300"
              >{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
