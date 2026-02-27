import { useEffect, useState } from 'react'
import AreaChart from './AreaChart'

const API_BASE = import.meta.env.VITE_API_URL || ''

function TrendArrow({ trend, change }) {
  if (trend === 'up' || change >= 0.5) return <span className="text-emerald-400">▲ {Math.abs(change).toFixed(1)}%</span>
  if (trend === 'down' || change <= -0.5) return <span className="text-red-400">▼ {Math.abs(change).toFixed(1)}%</span>
  return <span className="text-zinc-400">→ {Math.abs(change).toFixed(1)}%</span>
}

function StatusBadge({ coverage }) {
  if (coverage >= 80) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">Good</span>
  if (coverage >= 60) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">Warning</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Poor</span>
}

function ThresholdBadge({ current, threshold }) {
  if (current == null) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-500/20 text-zinc-400">No data</span>
  if (current >= 80) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">{current.toFixed(1)}% ✓</span>
  if (current >= threshold) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">{current.toFixed(1)}%</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">{current.toFixed(1)}% ✗ Below {threshold}%</span>
}

export default function CoverageTab({ projectId }) {
  const [data, setData] = useState(null)
  const [thresholdData, setThresholdData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const [trendRes, thresholdRes] = await Promise.all([
          fetch(`${API_BASE}/api/qa/global/project/${projectId}/coverage-trend?days=30`),
          fetch(`${API_BASE}/api/qa/coverage/${projectId}`)
        ])
        if (!trendRes.ok) throw new Error(`HTTP ${trendRes.status}`)
        const json = await trendRes.json()
        if (!cancelled) setData(json)
        if (thresholdRes.ok) {
          const tj = await thresholdRes.json()
          if (!cancelled) setThresholdData(tj)
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [projectId])

  if (loading) return <div className="flex justify-center py-20 text-md-on-surface-variant animate-pulse">Loading coverage data…</div>
  if (error) return <div className="flex justify-center py-20 text-red-400">Error: {error}</div>
  if (!data) return <div className="flex justify-center py-20 text-md-on-surface-variant">No coverage data available</div>

  const { overall, history, files } = data
  const sortedFiles = [...(files || [])].sort((a, b) => a.coverage - b.coverage)
  const worstFile = sortedFiles.find((f) => f.coverage < 60)

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      {overall && (
        <div className="bg-md-surface-container border border-md-outline-variant rounded-md-lg p-5">
          <div className="text-md-on-surface-variant text-sm mb-1">OVERALL</div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-md-on-background">{overall.current?.toFixed(1)}%</span>
            <span className="text-sm">
              (<TrendArrow trend={overall.trend} change={overall.change} /> from last week)
            </span>
          </div>
        </div>
      )}

      {/* Deploy Threshold */}
      {thresholdData && (
        <div className="bg-md-surface-container border border-md-outline-variant rounded-md-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-md-on-surface-variant text-sm">DEPLOY THRESHOLD</div>
            <ThresholdBadge current={thresholdData.current} threshold={thresholdData.threshold} />
          </div>
          <div className="text-xs text-md-on-surface-variant mb-2">
            Minimum {thresholdData.threshold}% required to deploy. {thresholdData.passing ? '✅ Passing' : '❌ Blocked'}
          </div>
          {thresholdData.history && thresholdData.history.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="text-xs text-md-on-surface-variant font-medium">Recent readings:</div>
              {thresholdData.history.slice(0, 5).map((h, i) => (
                <div key={i} className="flex justify-between text-xs text-md-on-background">
                  <span>{parseFloat(h.coverage_pct).toFixed(1)}%</span>
                  <span className="text-md-on-surface-variant">{new Date(h.recorded_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Area Chart */}
      {history && history.length > 0 && (
        <div className="bg-md-surface-container border border-md-outline-variant rounded-md-lg p-5">
          <h3 className="text-md-on-background font-semibold mb-4">Coverage Trend (30 days)</h3>
          <AreaChart data={history} xKey="date" yKey="coverage" color="#a78bfa" />
        </div>
      )}

      {/* File Breakdown */}
      <div className="bg-md-surface-container border border-md-outline-variant rounded-md-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-md-outline-variant">
          <h3 className="text-md-on-background font-semibold">File Breakdown</h3>
        </div>
        {sortedFiles.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-md-on-surface-variant text-left border-b border-md-outline-variant">
                <th className="px-5 py-2 font-medium">File</th>
                <th className="px-5 py-2 font-medium">Coverage %</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiles.map((f) => (
                <tr key={f.file} className="border-b border-md-outline-variant">
                  <td className="px-5 py-2 text-md-on-background font-mono text-xs">{f.file}</td>
                  <td className="px-5 py-2">{f.coverage.toFixed(1)}%</td>
                  <td className="px-5 py-2"><StatusBadge coverage={f.coverage} /></td>
                  <td className="px-5 py-2">
                    {f.change != null ? <TrendArrow trend={f.trend} change={f.change} /> : <span className="text-zinc-500">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-8 text-center text-md-on-surface-variant">Per-file coverage not yet available</div>
        )}
      </div>

      {/* Recommendation */}
      {worstFile && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-md-lg p-4 text-amber-300 text-sm">
          🎯 Focus on <span className="font-mono font-semibold">{worstFile.file}</span> — currently at {worstFile.coverage.toFixed(1)}% coverage
        </div>
      )}
    </div>
  )
}
