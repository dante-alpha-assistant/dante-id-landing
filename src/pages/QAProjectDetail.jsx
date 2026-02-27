import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || ''

function StatusBadge({ status, large }) {
  const color = status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : status === 'failure' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-500/20 text-zinc-400'
  const label = status === 'success' ? 'Passing' : status === 'failure' ? 'Failing' : 'Unknown'
  const size = large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
  return <span className={`${size} rounded-full font-medium ${color}`}>{label}</span>
}

function MetricCard({ title, children }) {
  return (
    <div className="bg-md-surface-container border border-md-outline-variant rounded-md-lg p-5">
      <div className="text-md-on-surface-variant text-sm mb-2">{title}</div>
      {children}
    </div>
  )
}

export default function QAProjectDetail() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/qa/global/project/${project_id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [project_id])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-md-background text-md-on-background flex items-center justify-center">
        <div className="text-md-on-surface-variant animate-pulse text-lg">Loading project…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-md-background text-md-on-background flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    )
  }

  const { project, latest, runs, run_count } = data
  const testPct = latest && latest.test_total > 0 ? Math.round((latest.test_passed / latest.test_total) * 100) : 0
  const coveragePct = latest ? Math.round(latest.test_coverage ?? 0) : 0
  const displayRuns = (runs || []).slice(0, 20)

  return (
    <div className="min-h-screen bg-md-background text-md-on-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <button onClick={() => navigate('/qa/dashboard')} className="text-md-primary hover:underline text-sm mb-6 inline-flex items-center gap-1">
          ← QA Dashboard <span className="text-md-on-surface-variant">/ {project.name}</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-md-on-background">{project.name}</h1>
            <StatusBadge status={project.status} large />
          </div>
          <p className="text-md-on-surface-variant text-sm">{run_count} CI run{run_count !== 1 ? 's' : ''} recorded</p>
        </div>

        {/* Metric Cards */}
        {latest && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <MetricCard title="Build Status">
              <StatusBadge status={latest.build_status} large />
            </MetricCard>
            <MetricCard title="Lint Errors">
              <span className={`text-2xl font-bold ${latest.lint_errors === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {latest.lint_errors}
              </span>
            </MetricCard>
            <MetricCard title="Tests">
              <span className={`text-2xl font-bold ${testPct === 100 ? 'text-emerald-400' : testPct >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                {latest.test_passed}/{latest.test_total}
              </span>
              <span className="text-md-on-surface-variant text-sm ml-2">({testPct}%)</span>
            </MetricCard>
            <MetricCard title="Coverage">
              <span className={`text-2xl font-bold ${coveragePct >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {coveragePct}%
              </span>
            </MetricCard>
          </div>
        )}

        {/* CI Run History */}
        <div className="bg-md-surface-container border border-md-outline-variant rounded-md-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-md-outline-variant">
            <h2 className="text-md-on-background font-semibold">CI Run History</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-md-on-surface-variant text-left border-b border-md-outline-variant">
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-5 py-2 font-medium">Build</th>
                <th className="px-5 py-2 font-medium">Tests</th>
                <th className="px-5 py-2 font-medium">Coverage</th>
                <th className="px-5 py-2 font-medium">Lint</th>
              </tr>
            </thead>
            <tbody>
              {displayRuns.map((run) => {
                const failed = run.build_status === 'failure'
                const runTestPct = run.test_total > 0 ? Math.round((run.test_passed / run.test_total) * 100) : 0
                return (
                  <tr key={run.id} className={`border-b border-md-outline-variant ${failed ? 'bg-red-500/10' : ''}`}>
                    <td className="px-5 py-2 text-md-on-surface-variant">{new Date(run.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-2"><StatusBadge status={run.build_status} /></td>
                    <td className="px-5 py-2">{run.test_passed}/{run.test_total} ({runTestPct}%)</td>
                    <td className="px-5 py-2">{Math.round(run.test_coverage ?? 0)}%</td>
                    <td className="px-5 py-2">{run.lint_errors}</td>
                  </tr>
                )
              })}
              {displayRuns.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-4 text-center text-md-on-surface-variant">No runs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
