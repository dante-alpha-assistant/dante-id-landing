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

  useEffect(() => {
    apiFetch(`/${project_id}`).then(d => {
      setIterations(d.iterations || [])
      setLoading(false)
    })
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
    if (s === 'done') return 'text-[#33ff00]'
    if (s === 'failed') return 'text-red-400'
    if (['planning', 'building', 'testing', 'deploying'].includes(s)) return 'text-yellow-400'
    return 'text-[#1a6b1a]'
  }

  const statusLabel = (s) => {
    const map = { pending: '[ PENDING ]', planning: '[ PLANNING... ]', building: '[ BUILDING... ]', testing: '[ TESTING... ]', deploying: '[ DEPLOYING... ]', done: '[ DONE ✓ ]', failed: '[ FAILED ✗ ]' }
    return map[s] || `[ ${s.toUpperCase()} ]`
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      <header className="border-b border-[#1f521f] px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">dante.id <span className="text-[#22aa00] text-sm font-normal">// iterate</span></h1>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/deployer/${project_id}`)} className="text-[10px] border border-[#1f521f] px-3 py-1 hover:border-[#33ff00]">[ ← DEPLOYER ]</button>
            <button onClick={() => navigate('/dashboard')} className="text-[10px] border border-[#1f521f] px-3 py-1 hover:border-[#33ff00]">[ DASHBOARD ]</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* New Iteration Form */}
        <div className="bg-[#0f0f0f] border border-[#1f521f] p-6">
          <div className="text-xs text-[#1a6b1a] mb-4">+--- DESCRIBE YOUR CHANGES ---+</div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what you want to change, add, or fix..."
            rows={4}
            className="w-full bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] text-sm p-3 font-mono focus:outline-none focus:border-[#33ff00] resize-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[10px] text-[#1a6b1a]">AI will generate work orders → build changes → redeploy automatically</p>
            <button
              onClick={handleSubmit}
              disabled={submitting || !description.trim()}
              className="text-sm border border-[#33ff00] text-[#33ff00] px-4 py-2 hover:bg-[#33ff00] hover:text-[#0a0a0a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '[ ITERATING... ]' : '[ ITERATE → ]'}
            </button>
          </div>
        </div>

        {/* Iteration History */}
        <div className="bg-[#0f0f0f] border border-[#1f521f] p-6">
          <div className="text-xs text-[#1a6b1a] mb-4">+--- ITERATION HISTORY ---+</div>
          {loading ? (
            <div className="text-[#1a6b1a] terminal-blink">[ LOADING... ]</div>
          ) : iterations.length === 0 ? (
            <p className="text-[#1a6b1a] text-xs">No iterations yet. Describe a change above to start.</p>
          ) : (
            <div className="space-y-4">
              {iterations.map(iter => (
                <div key={iter.id} className="border border-[#1f521f] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-bold ${statusColor(iter.status)}`}>{statusLabel(iter.status)}</span>
                    <span className="text-[10px] text-[#1a6b1a]">{new Date(iter.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-[#22aa00] mb-2">{iter.description}</p>
                  {iter.work_orders && Array.isArray(iter.work_orders) && (
                    <div className="mt-2 space-y-1">
                      {iter.work_orders.map((wo, i) => (
                        <div key={i} className="text-[10px] text-[#1a6b1a]">
                          → {wo.title} <span className="text-[#0f3f0f]">({wo.priority})</span>
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
