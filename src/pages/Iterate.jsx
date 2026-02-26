import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const API = '/api/iterate'

async function apiFetch(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json', ...opts.headers },
  })
  return res.json()
}

export default function Iterate() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [description, setDescription] = useState('')
  const [iterations, setIterations] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [project, setProject] = useState(null)

  useEffect(() => {
    apiFetch(`/${project_id}`).then(d => {
      setIterations(d.iterations || [])
      setLoading(false)
    })
    supabase.from('projects').select('name,company_name,idea,deploy_url').eq('id', project_id).single().then(({ data }) => setProject(data))
  }, [project_id])

  // Poll for active iterations
  useEffect(() => {
    const active = iterations.some(i => ['planning', 'building', 'testing', 'deploying'].includes(i.status))
    if (!active) return
    const interval = setInterval(() => {
      apiFetch(`/${project_id}`).then(d => setIterations(d.iterations || []))
    }, 10000)
    return () => clearInterval(interval)
  }, [iterations, project_id])

  const handleSubmit = async () => {
    if (!description.trim()) return
    setSubmitting(true)
    const res = await apiFetch('/start', {
      method: 'POST',
      body: JSON.stringify({ project_id, description: description.trim() }),
    })
    if (res.iteration_id) {
      setDescription('')
      setIterations(prev => [{ id: res.iteration_id, description: description.trim(), status: 'planning', created_at: new Date().toISOString() }, ...prev])
    }
    setSubmitting(false)
  }

  const statusColor = (s) => {
    if (s === 'done') return 'text-md-primary'
    if (s === 'failed') return 'text-red-500'
    if (['planning', 'building', 'testing', 'deploying'].includes(s)) return 'text-amber-500'
    return 'text-md-outline'
  }

  const statusLabel = (s) => {
    const map = { pending: 'Pending', planning: 'Planning...', building: 'Building...', testing: 'Testing...', deploying: 'Deploying...', done: 'Done ✓', failed: 'Failed ✗' }
    return map[s] || s?.toUpperCase() || 'Unknown'
  }

  return (
    <div className="min-h-screen bg-md-background text-md-on-surface">
      <header className="border-b border-md-outline-variant px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">dante.id <span className="text-md-on-surface-variant text-sm font-normal">// iterate // {project?.name || project?.company_name || 'Project'}</span></h1>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/dashboard/${project_id}`)} className="text-[10px] border border-md-outline-variant px-3 py-1 hover:border-md-primary">← {(project?.name || 'Dashboard')}</button>
            <button onClick={() => navigate('/dashboard')} className="text-[10px] border border-md-outline-variant px-3 py-1 hover:border-md-primary">Dashboard</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* New Iteration Form */}
        <div className="bg-md-surface-container rounded-md-lg p-6 shadow-sm hover:shadow-md">
          <div className="text-xs text-md-outline mb-4">Describe Your Changes</div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what you want to change, add, or fix..."
            rows={4}
            className="w-full bg-md-background border border-md-outline-variant text-md-primary text-sm p-3 focus:outline-none focus:border-md-primary resize-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[10px] text-md-outline">AI will generate work orders → build changes → redeploy automatically</p>
            <button
              onClick={handleSubmit}
              disabled={submitting || !description.trim()}
              className="text-sm border border-md-primary text-md-primary px-4 py-2 hover:bg-md-primary hover:text-md-on-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all ease-md-standard duration-300"
            >
              {submitting ? 'Iterating...' : 'Iterate →'}
            </button>
          </div>
        </div>

        {/* Iteration History */}
        <div className="bg-md-surface-container rounded-md-lg p-6 shadow-sm hover:shadow-md">
          <div className="text-xs text-md-outline mb-4">Iteration History</div>
          {loading ? (
            <div className="text-md-outline animate-pulse">Loading...</div>
          ) : iterations.length === 0 ? (
            <p className="text-md-outline text-xs">No iterations yet. Describe a change above to start.</p>
          ) : (
            <div className="space-y-4">
              {iterations.map(iter => (
                <div key={iter.id} className="border border-md-outline-variant rounded-md-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-bold ${statusColor(iter.status)}`}>{statusLabel(iter.status)}</span>
                    <span className="text-[10px] text-md-outline">{new Date(iter.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-md-on-surface-variant mb-2">{iter.description}</p>
                  {iter.work_orders && Array.isArray(iter.work_orders) && (
                    <div className="mt-2 space-y-1">
                      {iter.work_orders.map((wo, i) => (
                        <div key={i} className="text-[10px] text-md-outline">
                          → {wo.title} <span className="text-md-outline">({wo.priority})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
