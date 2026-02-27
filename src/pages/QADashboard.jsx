import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import QAStatusCard from '../components/qa/QAStatusCard'

const API_BASE = import.meta.env.VITE_API_URL || ''

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' }
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

function StatusBadge({ status }) {
  const color = status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : status === 'failure' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-500/20 text-zinc-400'
  const label = status === 'success' ? 'Passing' : status === 'failure' ? 'Failing' : 'Unknown'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>
}

export default function QADashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const result = await apiFetch('/api/qa/global/overview')
      setData(result)
    } catch (err) {
      console.error('QA global load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="min-h-screen bg-md-background flex items-center justify-center">
        <div className="text-md-primary text-sm animate-pulse">Loading QA Dashboard...</div>
      </div>
    )
  }

  const p = data?.platform || {}

  return (
    <div className="min-h-screen bg-md-background text-md-on-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-md-on-background text-xl font-semibold tracking-tight">QA Command Center</h1>
          <p className="text-md-on-surface-variant text-xs">Platform-wide quality metrics across all projects</p>
        </div>
        <button onClick={load} className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 text-sm font-medium active:scale-95 transition-transform">↻ Refresh</button>
      </div>

      {/* Platform Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <QAStatusCard title="Health Score" value={p.health_score != null ? `${p.health_score}%` : '—'} status={p.health_score >= 80 ? 'pass' : p.health_score != null ? 'fail' : 'unknown'} icon="💚" />
        <QAStatusCard title="Avg Lint Errors" value={p.avg_lint_errors ?? '—'} status={p.avg_lint_errors === 0 ? 'pass' : p.avg_lint_errors > 0 ? 'fail' : 'unknown'} icon="⚡" />
        <QAStatusCard title="Builds Passing" value={p.builds_total ? `${p.builds_passing}/${p.builds_total}` : '—'} status={p.builds_passing === p.builds_total ? 'pass' : 'fail'} icon="🔨" />
        <QAStatusCard title="Avg Test Pass Rate" value={p.avg_test_pass_rate != null ? `${p.avg_test_pass_rate}%` : '—'} status={p.avg_test_pass_rate >= 90 ? 'pass' : p.avg_test_pass_rate != null ? 'fail' : 'unknown'} icon="✓" />
        <QAStatusCard title="Avg Coverage" value={p.avg_coverage != null ? `${p.avg_coverage}%` : '—'} status={p.avg_coverage >= 80 ? 'pass' : p.avg_coverage != null ? 'fail' : 'unknown'} icon="◉" />
      </div>

      {/* Per-Project Table */}
      <div className="bg-md-surface-container rounded-md-lg border border-md-outline-variant overflow-hidden">
        <div className="px-4 py-3 border-b border-md-outline-variant">
          <h2 className="text-md-on-background text-sm font-semibold">Projects</h2>
          <p className="text-md-on-surface-variant text-xs">{data?.projects?.length || 0} projects with CI data</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-md-on-surface-variant text-xs uppercase tracking-wider border-b border-md-outline-variant">
                <th className="text-left px-4 py-2">Project</th>
                <th className="text-center px-4 py-2">Build</th>
                <th className="text-center px-4 py-2">Lint</th>
                <th className="text-center px-4 py-2">Tests</th>
                <th className="text-center px-4 py-2">Coverage</th>
                <th className="text-center px-4 py-2">Runs</th>
                <th className="text-right px-4 py-2">Last Run</th>
              </tr>
            </thead>
            <tbody>
              {(data?.projects || []).map((proj, i) => (
                <tr key={proj.project_id || i} className="border-b border-md-outline-variant/50 hover:bg-md-surface-container-high transition-colors cursor-pointer" onClick={() => proj.project_id && navigate(`/qa/${proj.project_id}`)}>
                  <td className="px-4 py-3">
                    <div className="text-md-on-background font-medium">{proj.project_name}</div>
                    {proj.project_status && <div className="text-md-on-surface-variant text-xs">{proj.project_status}</div>}
                  </td>
                  <td className="text-center px-4 py-3"><StatusBadge status={proj.build_status} /></td>
                  <td className="text-center px-4 py-3">
                    <span className={proj.lint_errors === 0 ? 'text-emerald-400' : 'text-amber-400'}>{proj.lint_errors ?? '—'}</span>
                  </td>
                  <td className="text-center px-4 py-3">
                    {proj.test_total != null ? (
                      <span className={proj.test_failed === 0 ? 'text-emerald-400' : 'text-red-400'}>{proj.test_passed}/{proj.test_total}</span>
                    ) : '—'}
                  </td>
                  <td className="text-center px-4 py-3">
                    {proj.test_coverage != null ? (
                      <span className={proj.test_coverage >= 80 ? 'text-emerald-400' : 'text-amber-400'}>{proj.test_coverage}%</span>
                    ) : '—'}
                  </td>
                  <td className="text-center px-4 py-3 text-md-on-surface-variant">{proj.run_count}</td>
                  <td className="text-right px-4 py-3 text-md-on-surface-variant text-xs">
                    {proj.last_run ? new Date(proj.last_run).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {(!data?.projects || data.projects.length === 0) && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-md-on-surface-variant">No CI data yet. Push to main to trigger the smoke test.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
