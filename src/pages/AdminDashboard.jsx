import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STATUS_COLORS = {
  pending: 'text-md-on-surface-variant',
  refining: 'text-md-primary',
  designed: 'text-md-primary',
  planning: 'text-md-primary',
  building: 'text-amber-600',
  tested: 'text-emerald-600',
  live: 'text-emerald-600',
  completed: 'text-emerald-600',
}

const PIPELINE = [
  { letter: 'R', label: 'Refinery' },
  { letter: 'F', label: 'Foundry' },
  { letter: 'P', label: 'Planner' },
  { letter: 'B', label: 'Builder' },
  { letter: 'I', label: 'Inspector' },
  { letter: 'D', label: 'Deployer' },
]
const STATUS_STEP = { pending: 0, refining: 1, designed: 2, planning: 3, building: 4, tested: 5, live: 6, completed: 6 }

async function apiCall(path) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`/api/admin${path}`, {
    headers: { Authorization: `Bearer ${session?.access_token}` }
  })
  if (res.status === 403) throw new Error('Not authorized')
  return res.json()
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [expandedUsage, setExpandedUsage] = useState({})

  useEffect(() => {
    apiCall('/projects')
      .then(data => {
        setProjects(data.projects || [])
        setTotalUsers(data.total_users || 0)
        setTotalCost(data.total_platform_cost || 0)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-md-background flex items-center justify-center">
      <div className="text-md-primary animate-pulse">Loading...</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-md-background flex items-center justify-center">
      <div className="text-red-500">ACCESS DENIED: {error}</div>
    </div>
  )

  const statusCounts = {}
  projects.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1 })

  return (
    <div className="min-h-screen bg-md-background text-md-on-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-md-border/20">
        <div className="flex items-center gap-4">
          <span className="text-xl font-semibold tracking-tight">dante.</span>
          <span className="text-md-border/40">/</span>
          <span className="text-sm text-md-on-surface-variant">Admin Dashboard</span>
        </div>
        <button onClick={() => navigate('/dashboard')}
          className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 text-sm font-medium active:scale-95 transition-transform">
          Dashboard
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 px-6 py-4 border-b border-md-border/20 flex-wrap">
        <div className="bg-md-surface-container rounded-md-sm px-4 py-2">
          <span className="text-[10px] text-md-on-surface-variant block">USERS</span>
          <span className="text-2xl font-bold text-md-on-background">{totalUsers}</span>
        </div>
        <div className="bg-md-surface-container rounded-md-sm px-4 py-2">
          <span className="text-[10px] text-md-on-surface-variant block">PROJECTS</span>
          <span className="text-2xl font-bold text-md-on-background">{projects.length}</span>
        </div>
        <div className="bg-md-surface-container rounded-md-sm px-4 py-2">
          <span className="text-[10px] text-amber-600 block">AI COST</span>
          <span className="text-2xl font-bold text-amber-600">${totalCost.toFixed(2)}</span>
        </div>
        {Object.entries(statusCounts).map(([s, c]) => (
          <div key={s} className="bg-md-surface-container rounded-md-sm px-3 py-2">
            <span className="text-[10px] text-md-on-surface-variant block">{s.toUpperCase()}</span>
            <span className={`text-lg font-bold ${STATUS_COLORS[s] || 'text-md-on-background'}`}>{c}</span>
          </div>
        ))}
      </div>

      {/* Projects table */}
      <div className="px-6 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-md-on-surface-variant text-[10px] uppercase border-b border-md-border/20">
              <th className="text-left py-2 px-2">Project</th>
              <th className="text-left py-2 px-2">User</th>
              <th className="text-left py-2 px-2">Pipeline</th>
              <th className="text-left py-2 px-2">Status</th>
              <th className="text-right py-2 px-2">Features</th>
              <th className="text-right py-2 px-2">BPs</th>
              <th className="text-right py-2 px-2">WOs</th>
              <th className="text-right py-2 px-2">Builds</th>
              <th className="text-right py-2 px-2">Tests</th>
              <th className="text-right py-2 px-2">Deploys</th>
              <th className="text-right py-2 px-2 text-amber-600">Cost</th>
              <th className="text-right py-2 px-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, idx) => {
              const step = STATUS_STEP[p.status] || 0
              return (
                <tr key={p.id}
                  onClick={() => {
                    const next = expanded === p.id ? null : p.id
                    setExpanded(next)
                    if (next && !expandedUsage[next]) {
                      supabase.auth.getSession().then(({ data: { session } }) => {
                        fetch(`/api/projects/${next}/usage`, { headers: { Authorization: `Bearer ${session?.access_token}` } })
                          .then(r => r.json()).then(d => setExpandedUsage(prev => ({ ...prev, [next]: d }))).catch(() => {})
                      })
                    }
                  }}
                  className={`border-b border-md-border/10 hover:bg-md-surface-container/50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-md-surface-container' : 'bg-md-background'}`}>
                  <td className="py-2 px-2 font-semibold text-md-on-background">
                    {p.deploy_url ? (
                      <a href={p.deploy_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:text-md-primary transition-colors">{p.name} 🔗</a>
                    ) : p.name}
                  </td>
                  <td className="py-2 px-2 text-md-on-surface-variant text-xs">{p.user_email}</td>
                  <td className="py-2 px-2">
                    <div className="flex gap-0.5">
                      {PIPELINE.map((s, i) => (
                        <div key={i} title={s.label} className={`w-5 h-5 flex items-center justify-center text-[8px] rounded-full ${i < step ? 'bg-md-primary text-md-on-primary font-bold' : i === step ? 'border-2 border-md-primary text-md-primary' : 'border border-md-border/30 text-md-on-surface-variant'}`}>{s.letter}</div>
                      ))}
                    </div>
                  </td>
                  <td className={`py-2 px-2 text-xs ${STATUS_COLORS[p.status] || ''}`}>{p.status}</td>
                  <td className="py-2 px-2 text-right text-md-on-background">{p.features}</td>
                  <td className="py-2 px-2 text-right text-md-on-background">{p.blueprints}</td>
                  <td className="py-2 px-2 text-right text-md-on-background">{p.work_orders}</td>
                  <td className="py-2 px-2 text-right text-md-on-background">{p.builds}</td>
                  <td className="py-2 px-2 text-right text-md-on-background">{p.tests}</td>
                  <td className="py-2 px-2 text-right text-md-on-background">{p.deployments}</td>
                  <td className="py-2 px-2 text-right text-amber-600">{p.cost_usd > 0 ? `$${p.cost_usd.toFixed(2)}` : '—'}</td>
                  <td className="py-2 px-2 text-right text-[10px] text-md-on-surface-variant">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              )
            })}
            {expanded && (() => {
              const p = projects.find(pr => pr.id === expanded)
              if (!p) return null
              return (
                <tr key={`${expanded}-detail`}>
                  <td colSpan={12} className="py-3 px-4 bg-md-surface-container rounded-md-sm">
                    <div className="text-xs space-y-1">
                      <p><span className="text-md-on-surface-variant">ID:</span> <span className="text-md-on-background">{p.id}</span></p>
                      <p><span className="text-md-on-surface-variant">Idea:</span> <span className="text-md-on-background">{p.idea || 'N/A'}</span></p>
                      <p><span className="text-md-on-surface-variant">Pipeline:</span> <span className="text-md-primary">{p.features}F → {p.blueprints}BP → {p.work_orders}WO → {p.builds}B → {p.tests}T → {p.deployments}D</span></p>
                      {p.deploy_url && (
                        <p><span className="text-md-on-surface-variant">Live URL:</span> <a href={p.deploy_url} target="_blank" rel="noopener noreferrer" className="text-md-primary hover:underline">{p.deploy_url}</a></p>
                      )}
                      {/* Cost Breakdown */}
                      {expandedUsage[p.id] && expandedUsage[p.id].total_calls > 0 && (
                        <div className="mt-3 bg-md-background rounded-md-sm p-3">
                          <p className="text-amber-600 font-bold mb-2">AI Cost Breakdown — ${expandedUsage[p.id].total_cost_usd?.toFixed(4)}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                            <div><span className="text-md-on-surface-variant">Calls:</span> <span className="text-amber-600">{expandedUsage[p.id].total_calls}</span></div>
                            <div><span className="text-md-on-surface-variant">In:</span> <span className="text-amber-600">{(expandedUsage[p.id].total_input_tokens/1000).toFixed(1)}K</span></div>
                            <div><span className="text-md-on-surface-variant">Out:</span> <span className="text-amber-600">{(expandedUsage[p.id].total_output_tokens/1000).toFixed(1)}K</span></div>
                          </div>
                          {expandedUsage[p.id].by_module && (
                            <div className="space-y-0.5">
                              {Object.entries(expandedUsage[p.id].by_module).sort((a,b) => b[1].cost - a[1].cost).map(([mod, d]) => (
                                <div key={mod} className="flex justify-between">
                                  <span className="text-md-on-surface-variant">{mod}</span>
                                  <span className="text-amber-600">${d.cost?.toFixed(4)} · {d.calls} calls · {((d.input_tokens+d.output_tokens)/1000).toFixed(1)}K tok</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {expandedUsage[p.id].recent?.length > 0 && (
                            <details className="mt-2">
                              <summary className="text-md-on-surface-variant cursor-pointer hover:text-md-primary">Recent calls ({expandedUsage[p.id].recent.length})</summary>
                              <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                                {expandedUsage[p.id].recent.slice(0, 10).map((r, i) => (
                                  <div key={i} className="flex justify-between text-[10px]">
                                    <span className="text-md-on-surface-variant">{r.module}/{r.operation} · {r.model}</span>
                                    <span className="text-amber-600">${Number(r.cost_usd).toFixed(4)} · {r.latency_ms}ms</span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        {['Refinery', 'Foundry', 'Planner', 'Builder'].map(stage => (
                          <button key={stage} onClick={(e) => { e.stopPropagation(); navigate(`/${stage.toLowerCase()}/${p.id}`) }}
                            className="rounded-full border border-md-border/30 px-4 py-1.5 text-[10px] text-md-on-surface-variant hover:bg-md-primary hover:text-md-on-primary transition-colors">
                            {stage}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })()}
          </tbody>
        </table>
      </div>
    </div>
  )
}
