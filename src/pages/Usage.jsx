import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Usage() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRecent, setShowRecent] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetch(`/api/projects/${project_id}/usage`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
        .then(r => r.json())
        .then(d => { setData(d); setLoading(false) })
        .catch(() => setLoading(false))
    })
  }, [project_id])

  const fmt = (n) => typeof n === 'number' ? n.toLocaleString() : '0'
  const fmtCost = (n) => typeof n === 'number' ? `$${n.toFixed(4)}` : '$0.00'

  return (
    <div className="min-h-screen bg-md-background text-md-on-background">
      <header className="border-b border-md-border/20 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold">dante. <span className="text-md-on-surface-variant text-sm font-normal">/ usage</span></h1>
          <button onClick={() => navigate('/dashboard')} className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 text-sm font-medium active:scale-95 transition-transform">Dashboard</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {loading ? (
          <div className="text-md-primary animate-pulse">Loading...</div>
        ) : !data || data.error ? (
          <div className="text-red-500 text-sm">{data?.error || 'Failed to load usage data'}</div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-md-surface-container rounded-md-lg p-6 shadow-sm">
              <div className="text-xs text-md-on-surface-variant mb-4 font-medium uppercase tracking-wider">Total AI Usage</div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-2xl font-bold text-md-on-background">{fmtCost(data.total_cost_usd)}</div>
                  <div className="text-[10px] text-md-on-surface-variant uppercase">Total Cost</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-md-on-background">{fmt(data.total_input_tokens + data.total_output_tokens)}</div>
                  <div className="text-[10px] text-md-on-surface-variant uppercase">Total Tokens</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-md-on-background">{fmt(data.total_calls)}</div>
                  <div className="text-[10px] text-md-on-surface-variant uppercase">AI Calls</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-md-primary">{fmt(data.total_input_tokens)}</div>
                  <div className="text-[10px] text-md-on-surface-variant uppercase">Input Tokens</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-md-primary">{fmt(data.total_output_tokens)}</div>
                  <div className="text-[10px] text-md-on-surface-variant uppercase">Output Tokens</div>
                </div>
              </div>
            </div>

            {/* By Module */}
            <div className="bg-md-surface-container rounded-md-lg p-6 shadow-sm">
              <div className="text-xs text-md-on-surface-variant mb-4 font-medium uppercase tracking-wider">Cost by Module</div>
              {data.by_module && Object.keys(data.by_module).length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-md-on-surface-variant border-b border-md-border/20">
                      <th className="text-left py-2">Module</th>
                      <th className="text-right py-2">Calls</th>
                      <th className="text-right py-2">Input</th>
                      <th className="text-right py-2">Output</th>
                      <th className="text-right py-2">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.by_module)
                      .sort(([,a],[,b]) => b.cost - a.cost)
                      .map(([mod, m], idx) => (
                      <tr key={mod} className={`border-b border-md-border/10 ${idx % 2 === 0 ? 'bg-md-surface-container' : 'bg-md-background'}`}>
                        <td className="py-2 text-md-on-background uppercase">{mod}</td>
                        <td className="py-2 text-right text-md-on-background">{m.calls}</td>
                        <td className="py-2 text-right text-md-on-background">{fmt(m.input_tokens)}</td>
                        <td className="py-2 text-right text-md-on-background">{fmt(m.output_tokens)}</td>
                        <td className="py-2 text-right text-md-primary font-semibold">{fmtCost(m.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-md-on-surface-variant text-xs">No usage data yet. Run a pipeline step to start tracking.</p>
              )}
            </div>

            {/* Recent Calls */}
            <div className="bg-md-surface-container rounded-md-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-md-on-surface-variant font-medium uppercase tracking-wider">Recent AI Calls</div>
                <button onClick={() => setShowRecent(!showRecent)} className="rounded-full border border-md-border/30 px-4 py-1.5 text-xs text-md-on-surface-variant hover:bg-md-surface-variant/50 transition-colors">
                  {showRecent ? 'Hide' : 'Show'}
                </button>
              </div>
              {showRecent && data.recent && data.recent.length > 0 && (
                <div className="space-y-2">
                  {data.recent.map((r, i) => (
                    <div key={i} className={`rounded-md-sm p-2 text-[10px] ${i % 2 === 0 ? 'bg-md-surface-container' : 'bg-md-background'}`}>
                      <div className="flex justify-between">
                        <span className="text-md-on-background uppercase">{r.module}/{r.operation}</span>
                        <span className="text-md-on-surface-variant">{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-4 mt-1 text-md-on-surface-variant">
                        <span>{r.model}</span>
                        <span>{fmt(r.input_tokens)}+{fmt(r.output_tokens)}t</span>
                        <span className="text-md-primary">{fmtCost(Number(r.cost_usd))}</span>
                        <span>{r.latency_ms}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showRecent && (!data.recent || data.recent.length === 0) && (
                <p className="text-md-on-surface-variant text-xs">No calls recorded yet.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
