import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STATUS_COLORS = {
  pending: 'text-[#1a6b1a]',
  refining: 'text-[#22aa00]',
  designed: 'text-[#33ff00]',
  planning: 'text-[#33ff00]',
  building: 'text-[#ffb000]',
  tested: 'text-[#33ff00]',
  live: 'text-[#33ff00]',
  completed: 'text-[#33ff00]',
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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-[#33ff00] font-mono terminal-blink">[LOADING...]</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-[#ff3333] font-mono">ACCESS DENIED: {error}</div>
    </div>
  )

  const statusCounts = {}
  projects.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1 })

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f521f]">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>dante_</span>
          <span className="text-[#1a6b1a]">/</span>
          <span className="text-sm text-[#22aa00] uppercase">Admin Dashboard</span>
        </div>
        <button onClick={() => navigate('/dashboard')}
          className="text-sm text-[#22aa00] hover:bg-[#33ff00] hover:text-[#0a0a0a] border border-[#1f521f] px-3 py-1 transition-colors uppercase">
          [ DASHBOARD ]
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 px-6 py-4 border-b border-[#1f521f] flex-wrap">
        <div className="border border-[#1f521f] px-4 py-2">
          <span className="text-[10px] text-[#1a6b1a] block">USERS</span>
          <span className="text-2xl font-bold">{totalUsers}</span>
        </div>
        <div className="border border-[#1f521f] px-4 py-2">
          <span className="text-[10px] text-[#1a6b1a] block">PROJECTS</span>
          <span className="text-2xl font-bold">{projects.length}</span>
        </div>
        <div className="border border-[#ffb000]/30 px-4 py-2">
          <span className="text-[10px] text-[#ffb000] block">AI COST</span>
          <span className="text-2xl font-bold text-[#ffb000]">${totalCost.toFixed(2)}</span>
        </div>
        {Object.entries(statusCounts).map(([s, c]) => (
          <div key={s} className="border border-[#1f521f] px-3 py-2">
            <span className="text-[10px] text-[#1a6b1a] block">{s.toUpperCase()}</span>
            <span className={`text-lg font-bold ${STATUS_COLORS[s] || 'text-[#22aa00]'}`}>{c}</span>
          </div>
        ))}
      </div>

      {/* Projects table */}
      <div className="px-6 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#1a6b1a] text-[10px] uppercase border-b border-[#1f521f]">
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
              <th className="text-right py-2 px-2 text-[#ffb000]">Cost</th>
              <th className="text-right py-2 px-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => {
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
                  className="border-b border-[#1f521f]/50 hover:bg-[#33ff00]/5 cursor-pointer transition-colors">
                  <td className="py-2 px-2 font-bold text-[#33ff00]">
                    {p.deploy_url ? (
                      <a href={p.deploy_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:underline">{p.name} 🔗</a>
                    ) : p.name}
                  </td>
                  <td className="py-2 px-2 text-[#22aa00] text-xs">{p.user_email}</td>
                  <td className="py-2 px-2">
                    <div className="flex gap-0.5">
                      {PIPELINE.map((s, i) => (
                        <div key={i} title={s.label} className={`w-3 h-3 flex items-center justify-center text-[7px] border ${i < step ? 'bg-[#33ff00] border-[#33ff00] text-[#0a0a0a] font-bold' : i === step ? 'border-[#33ff00] text-[#33ff00]' : 'border-[#1f521f] text-[#1a6b1a]'}`}>{s.letter}</div>
                      ))}
                    </div>
                  </td>
                  <td className={`py-2 px-2 text-xs ${STATUS_COLORS[p.status] || ''}`}>{p.status}</td>
                  <td className="py-2 px-2 text-right text-[#22aa00]">{p.features}</td>
                  <td className="py-2 px-2 text-right text-[#22aa00]">{p.blueprints}</td>
                  <td className="py-2 px-2 text-right text-[#22aa00]">{p.work_orders}</td>
                  <td className="py-2 px-2 text-right text-[#22aa00]">{p.builds}</td>
                  <td className="py-2 px-2 text-right text-[#22aa00]">{p.tests}</td>
                  <td className="py-2 px-2 text-right text-[#22aa00]">{p.deployments}</td>
                  <td className="py-2 px-2 text-right text-[#ffb000]">{p.cost_usd > 0 ? `$${p.cost_usd.toFixed(2)}` : '—'}</td>
                  <td className="py-2 px-2 text-right text-[10px] text-[#1a6b1a]">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              )
            })}
            {expanded && (() => {
              const p = projects.find(pr => pr.id === expanded)
              if (!p) return null
              return (
                <tr key={`${expanded}-detail`}>
                  <td colSpan={11} className="py-3 px-4 bg-[#0f0f0f] border border-[#1f521f]">
                    <div className="text-xs space-y-1">
                      <p><span className="text-[#1a6b1a]">ID:</span> <span className="text-[#22aa00]">{p.id}</span></p>
                      <p><span className="text-[#1a6b1a]">Idea:</span> <span className="text-[#22aa00]">{p.idea || 'N/A'}</span></p>
                      <p><span className="text-[#1a6b1a]">Pipeline:</span> <span className="text-[#33ff00]">{p.features}F → {p.blueprints}BP → {p.work_orders}WO → {p.builds}B → {p.tests}T → {p.deployments}D</span></p>
                      {p.deploy_url && (
                        <p><span className="text-[#1a6b1a]">Live URL:</span> <a href={p.deploy_url} target="_blank" rel="noopener noreferrer" className="text-[#33ff00] hover:underline">{p.deploy_url}</a></p>
                      )}
                      {/* Cost Breakdown */}
                      {expandedUsage[p.id] && expandedUsage[p.id].total_calls > 0 && (
                        <div className="mt-3 border border-[#ffb000]/20 p-3">
                          <p className="text-[#ffb000] font-bold mb-2">AI COST BREAKDOWN — ${expandedUsage[p.id].total_cost_usd?.toFixed(4)}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                            <div><span className="text-[#1a6b1a]">Calls:</span> <span className="text-[#ffb000]">{expandedUsage[p.id].total_calls}</span></div>
                            <div><span className="text-[#1a6b1a]">In:</span> <span className="text-[#ffb000]">{(expandedUsage[p.id].total_input_tokens/1000).toFixed(1)}K</span></div>
                            <div><span className="text-[#1a6b1a]">Out:</span> <span className="text-[#ffb000]">{(expandedUsage[p.id].total_output_tokens/1000).toFixed(1)}K</span></div>
                          </div>
                          {expandedUsage[p.id].by_module && (
                            <div className="space-y-0.5">
                              {Object.entries(expandedUsage[p.id].by_module).sort((a,b) => b[1].cost - a[1].cost).map(([mod, d]) => (
                                <div key={mod} className="flex justify-between">
                                  <span className="text-[#1a6b1a]">{mod}</span>
                                  <span className="text-[#ffb000]">${d.cost?.toFixed(4)} · {d.calls} calls · {((d.input_tokens+d.output_tokens)/1000).toFixed(1)}K tok</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {expandedUsage[p.id].recent?.length > 0 && (
                            <details className="mt-2">
                              <summary className="text-[#1a6b1a] cursor-pointer hover:text-[#33ff00]">Recent calls ({expandedUsage[p.id].recent.length})</summary>
                              <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                                {expandedUsage[p.id].recent.slice(0, 10).map((r, i) => (
                                  <div key={i} className="flex justify-between text-[10px]">
                                    <span className="text-[#1a6b1a]">{r.module}/{r.operation} · {r.model}</span>
                                    <span className="text-[#ffb000]">${Number(r.cost_usd).toFixed(4)} · {r.latency_ms}ms</span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/refinery/${p.id}`) }}
                          className="text-[10px] border border-[#1f521f] px-2 py-0.5 hover:border-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors">
                          [ REFINERY ]
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/foundry/${p.id}`) }}
                          className="text-[10px] border border-[#1f521f] px-2 py-0.5 hover:border-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors">
                          [ FOUNDRY ]
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/planner/${p.id}`) }}
                          className="text-[10px] border border-[#1f521f] px-2 py-0.5 hover:border-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors">
                          [ PLANNER ]
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/builder/${p.id}`) }}
                          className="text-[10px] border border-[#1f521f] px-2 py-0.5 hover:border-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors">
                          [ BUILDER ]
                        </button>
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
