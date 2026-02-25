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
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      <header className="border-b border-[#1f521f] px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">dante.id <span className="text-[#22aa00] text-sm font-normal">// usage</span></h1>
          <button onClick={() => navigate('/dashboard')} className="text-[10px] border border-[#1f521f] px-3 py-1 hover:border-[#33ff00]">[ DASHBOARD ]</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {loading ? (
          <div className="text-[#1a6b1a] terminal-blink">[ LOADING... ]</div>
        ) : !data || data.error ? (
          <div className="text-red-400 text-sm">{data?.error || 'Failed to load usage data'}</div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-[#0f0f0f] border border-[#1f521f] p-6">
              <div className="text-xs text-[#1a6b1a] mb-4">+--- TOTAL AI USAGE ---+</div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-2xl font-bold">{fmtCost(data.total_cost_usd)}</div>
                  <div className="text-[10px] text-[#1a6b1a]">TOTAL COST</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{fmt(data.total_input_tokens + data.total_output_tokens)}</div>
                  <div className="text-[10px] text-[#1a6b1a]">TOTAL TOKENS</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{fmt(data.total_calls)}</div>
                  <div className="text-[10px] text-[#1a6b1a]">AI CALLS</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#22aa00]">{fmt(data.total_input_tokens)}</div>
                  <div className="text-[10px] text-[#1a6b1a]">INPUT TOKENS</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#22aa00]">{fmt(data.total_output_tokens)}</div>
                  <div className="text-[10px] text-[#1a6b1a]">OUTPUT TOKENS</div>
                </div>
              </div>
            </div>

            {/* By Module */}
            <div className="bg-[#0f0f0f] border border-[#1f521f] p-6">
              <div className="text-xs text-[#1a6b1a] mb-4">+--- COST BY MODULE ---+</div>
              {data.by_module && Object.keys(data.by_module).length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#1a6b1a] border-b border-[#1f521f]">
                      <th className="text-left py-2">MODULE</th>
                      <th className="text-right py-2">CALLS</th>
                      <th className="text-right py-2">INPUT</th>
                      <th className="text-right py-2">OUTPUT</th>
                      <th className="text-right py-2">COST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.by_module)
                      .sort(([,a],[,b]) => b.cost - a.cost)
                      .map(([mod, m]) => (
                      <tr key={mod} className="border-b border-[#1f521f]/30">
                        <td className="py-2 text-[#33ff00] uppercase">{mod}</td>
                        <td className="py-2 text-right text-[#22aa00]">{m.calls}</td>
                        <td className="py-2 text-right text-[#22aa00]">{fmt(m.input_tokens)}</td>
                        <td className="py-2 text-right text-[#22aa00]">{fmt(m.output_tokens)}</td>
                        <td className="py-2 text-right text-[#33ff00] font-bold">{fmtCost(m.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-[#1a6b1a] text-xs">No usage data yet. Run a pipeline step to start tracking.</p>
              )}
            </div>

            {/* Recent Calls */}
            <div className="bg-[#0f0f0f] border border-[#1f521f] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-[#1a6b1a]">+--- RECENT AI CALLS ---+</div>
                <button onClick={() => setShowRecent(!showRecent)} className="text-[10px] border border-[#1f521f] px-2 py-0.5 text-[#1a6b1a] hover:border-[#33ff00] hover:text-[#33ff00]">
                  {showRecent ? '[ HIDE ]' : '[ SHOW ]'}
                </button>
              </div>
              {showRecent && data.recent && data.recent.length > 0 && (
                <div className="space-y-2">
                  {data.recent.map((r, i) => (
                    <div key={i} className="border border-[#1f521f]/30 p-2 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-[#33ff00] uppercase">{r.module}/{r.operation}</span>
                        <span className="text-[#1a6b1a]">{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-4 mt-1 text-[#22aa00]">
                        <span>{r.model}</span>
                        <span>{fmt(r.input_tokens)}+{fmt(r.output_tokens)}t</span>
                        <span className="text-[#33ff00]">{fmtCost(Number(r.cost_usd))}</span>
                        <span>{r.latency_ms}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showRecent && (!data.recent || data.recent.length === 0) && (
                <p className="text-[#1a6b1a] text-xs">No calls recorded yet.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
