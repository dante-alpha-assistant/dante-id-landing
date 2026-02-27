import { useEffect, useState, useCallback } from 'react'
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

function SeverityBadge({ project }) {
  if (project.build_status === 'failure' || (project.test_total > 0 && project.test_passed === 0)) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">🚨 Critical</span>
  }
  if (project.lint_errors > 5 || (project.test_total > 0 && project.test_passed / project.test_total < 0.8) || (project.test_coverage != null && project.test_coverage < 70)) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">⚠️ Warning</span>
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">✅ Healthy</span>
}

function MiniBar({ value, max = 100, color = 'bg-emerald-500' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden inline-block ml-2 align-middle">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ── Slide-out Detail Panel ── */
function ProjectPanel({ projectId, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    apiFetch(`/api/qa/global/project/${projectId}`)
      .then(setDetail)
      .catch(err => console.error('Detail load error:', err))
      .finally(() => setLoading(false))
  }, [projectId])

  if (!projectId) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-md-surface-container z-50 shadow-2xl border-l border-md-outline-variant overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-md-surface-container border-b border-md-outline-variant px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-md-on-background font-semibold text-lg truncate pr-4">
            {loading ? 'Loading…' : detail?.project?.name || 'Project Detail'}
          </h2>
          <button onClick={onClose} className="text-md-on-surface-variant hover:text-md-on-background text-xl leading-none">✕</button>
        </div>

        {loading ? (
          <div className="p-6 text-md-on-surface-variant text-sm animate-pulse">Loading project details…</div>
        ) : !detail ? (
          <div className="p-6 text-md-on-surface-variant text-sm">Failed to load project data.</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Status overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-md-surface-container-high rounded-md-lg p-4">
                <div className="text-md-on-surface-variant text-xs uppercase tracking-wider mb-1">Build Status</div>
                <StatusBadge status={detail.latest?.build_status} />
              </div>
              <div className="bg-md-surface-container-high rounded-md-lg p-4">
                <div className="text-md-on-surface-variant text-xs uppercase tracking-wider mb-1">Project Status</div>
                <span className="text-md-on-background text-sm font-medium">{detail.project?.status || '—'}</span>
              </div>
              <div className="bg-md-surface-container-high rounded-md-lg p-4">
                <div className="text-md-on-surface-variant text-xs uppercase tracking-wider mb-1">Tests</div>
                <span className={`text-lg font-bold ${detail.latest?.test_failed === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {detail.latest?.test_passed ?? '—'}/{detail.latest?.test_total ?? '—'}
                </span>
                {detail.latest?.test_total > 0 && (
                  <span className="text-md-on-surface-variant text-xs ml-2">
                    ({Math.round((detail.latest.test_passed / detail.latest.test_total) * 100)}%)
                  </span>
                )}
              </div>
              <div className="bg-md-surface-container-high rounded-md-lg p-4">
                <div className="text-md-on-surface-variant text-xs uppercase tracking-wider mb-1">Coverage</div>
                <span className={`text-lg font-bold ${(detail.latest?.test_coverage ?? 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {detail.latest?.test_coverage != null ? `${detail.latest.test_coverage}%` : '—'}
                </span>
              </div>
              <div className="bg-md-surface-container-high rounded-md-lg p-4">
                <div className="text-md-on-surface-variant text-xs uppercase tracking-wider mb-1">Lint Errors</div>
                <span className={`text-lg font-bold ${detail.latest?.lint_errors === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {detail.latest?.lint_errors ?? '—'}
                </span>
              </div>
              <div className="bg-md-surface-container-high rounded-md-lg p-4">
                <div className="text-md-on-surface-variant text-xs uppercase tracking-wider mb-1">Total Runs</div>
                <span className="text-lg font-bold text-md-on-background">{detail.run_count}</span>
              </div>
            </div>

            {/* Repo link */}
            {detail.project?.repo_url && (
              <a href={detail.project.repo_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-md-primary text-sm hover:underline">
                ↗ View on GitHub
              </a>
            )}

            {/* CI Run History */}
            <div>
              <h3 className="text-md-on-background text-sm font-semibold mb-3">CI Run History</h3>
              {detail.runs.length === 0 ? (
                <p className="text-md-on-surface-variant text-xs">No CI runs recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {detail.runs.map((run, i) => (
                    <div key={run.id || i} className={`flex items-center gap-3 px-3 py-2 rounded-md-lg text-xs ${run.build_status === 'failure' ? 'bg-red-500/10 border border-red-500/20' : 'bg-md-surface-container-high'}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${run.build_status === 'success' ? 'bg-emerald-500' : run.build_status === 'failure' ? 'bg-red-500' : 'bg-zinc-500'}`} />
                      <span className="text-md-on-surface-variant w-36 flex-shrink-0">{new Date(run.created_at).toLocaleString()}</span>
                      <span className="text-md-on-background flex-shrink-0">
                        {run.test_passed}/{run.test_total} tests
                      </span>
                      {run.test_total > 0 && <MiniBar value={run.test_passed} max={run.test_total} color={run.test_failed === 0 ? 'bg-emerald-500' : 'bg-red-500'} />}
                      <span className="text-md-on-surface-variant ml-auto flex-shrink-0">
                        {run.test_coverage != null ? `${run.test_coverage}% cov` : ''}
                      </span>
                      {run.lint_errors > 0 && <span className="text-amber-400 flex-shrink-0">{run.lint_errors} lint</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/* ── Filter Tabs ── */
function FilterTabs({ active, onChange, projects }) {
  const counts = { all: projects.length, critical: 0, warning: 0, healthy: 0 }
  projects.forEach(p => {
    if (p.build_status === 'failure' || (p.test_total > 0 && p.test_passed === 0)) counts.critical++
    else if (p.lint_errors > 5 || (p.test_total > 0 && p.test_passed / p.test_total < 0.8) || (p.test_coverage != null && p.test_coverage < 70)) counts.warning++
    else counts.healthy++
  })
  const tabs = [
    { key: 'all', label: 'All Projects', count: counts.all },
    { key: 'critical', label: 'Critical', count: counts.critical },
    { key: 'warning', label: 'Warnings', count: counts.warning },
    { key: 'healthy', label: 'Healthy', count: counts.healthy },
  ]
  return (
    <div className="flex gap-2 mb-4">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active === t.key ? 'bg-md-primary text-md-on-primary' : 'bg-md-surface-container-high text-md-on-surface-variant hover:bg-md-surface-container-highest'}`}>
          {t.label} ({t.count})
        </button>
      ))}
    </div>
  )
}

function getSeverity(proj) {
  if (proj.build_status === 'failure' || (proj.test_total > 0 && proj.test_passed === 0)) return 'critical'
  if (proj.lint_errors > 5 || (proj.test_total > 0 && proj.test_passed / proj.test_total < 0.8) || (proj.test_coverage != null && proj.test_coverage < 70)) return 'warning'
  return 'healthy'
}

export default function QADashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedProject, setSelectedProject] = useState(null)

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
  const projects = data?.projects || []
  const filtered = filter === 'all' ? projects : projects.filter(pr => getSeverity(pr) === filter)

  return (
    <div className="min-h-screen bg-md-background text-md-on-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-md-on-background text-2xl font-bold tracking-tight">QA Command Center</h1>
          <p className="text-md-on-surface-variant text-sm mt-0.5">Platform-wide quality metrics across all projects</p>
        </div>
        <button onClick={load} className="rounded-full border border-md-outline-variant text-md-on-surface-variant px-5 py-2 text-sm font-medium hover:bg-md-surface-container-high active:scale-95 transition-all">↻ Refresh</button>
      </div>

      {/* Platform Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <QAStatusCard title="Health Score" value={p.health_score != null ? `${p.health_score}%` : '—'} status={p.health_score >= 90 ? 'pass' : p.health_score >= 70 ? 'warn' : p.health_score != null ? 'fail' : 'unknown'} icon="💚" tooltip="40% Build + 30% Tests + 20% Coverage + 10% Lint" />
        <QAStatusCard title="Avg Lint Errors" value={p.avg_lint_errors ?? '—'} status={p.avg_lint_errors === 0 ? 'pass' : p.avg_lint_errors <= 5 ? 'warn' : 'fail'} icon="⚡" />
        <QAStatusCard title="Builds Passing" value={p.builds_total ? `${p.builds_passing}/${p.builds_total}` : '—'} status={p.builds_passing === p.builds_total ? 'pass' : p.builds_passing > 0 ? 'warn' : 'fail'} icon="🔨" />
        <QAStatusCard title="Avg Test Pass Rate" value={p.avg_test_pass_rate != null ? `${p.avg_test_pass_rate}%` : '—'} status={p.avg_test_pass_rate >= 90 ? 'pass' : p.avg_test_pass_rate >= 70 ? 'warn' : p.avg_test_pass_rate != null ? 'fail' : 'unknown'} icon="✓" />
        <QAStatusCard title="Avg Coverage" value={p.avg_coverage != null ? `${p.avg_coverage}%` : '—'} status={p.avg_coverage >= 80 ? 'pass' : p.avg_coverage >= 60 ? 'warn' : p.avg_coverage != null ? 'fail' : 'unknown'} icon="◉" />
      </div>

      {/* Filter Tabs */}
      <FilterTabs active={filter} onChange={setFilter} projects={projects} />

      {/* Per-Project Table */}
      <div className="bg-md-surface-container rounded-md-lg border border-md-outline-variant overflow-hidden">
        <div className="px-4 py-3 border-b border-md-outline-variant flex items-center justify-between">
          <div>
            <h2 className="text-md-on-background text-sm font-semibold">Projects</h2>
            <p className="text-md-on-surface-variant text-xs">{filtered.length} of {projects.length} projects</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-md-on-surface-variant text-xs uppercase tracking-wider border-b border-md-outline-variant">
                <th className="text-left px-4 py-2">Project</th>
                <th className="text-center px-4 py-2">Severity</th>
                <th className="text-center px-4 py-2">Build</th>
                <th className="text-center px-4 py-2">Lint</th>
                <th className="text-center px-4 py-2">Tests</th>
                <th className="text-center px-4 py-2">Coverage</th>
                <th className="text-center px-4 py-2">Runs</th>
                <th className="text-right px-4 py-2">Last Run</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((proj, i) => {
                const isCritical = getSeverity(proj) === 'critical'
                return (
                  <tr key={proj.project_id || i}
                    className={`border-b border-md-outline-variant/50 hover:bg-md-surface-container-high transition-colors cursor-pointer ${isCritical ? 'bg-red-500/5 border-l-2 border-l-red-500' : ''}`}
                    onClick={() => setSelectedProject(proj.project_id)}>
                    <td className="px-4 py-3">
                      <div className="text-md-on-background font-medium">{proj.project_name}</div>
                      {proj.project_status && <div className="text-md-on-surface-variant text-xs">{proj.project_status}</div>}
                    </td>
                    <td className="text-center px-4 py-3"><SeverityBadge project={proj} /></td>
                    <td className="text-center px-4 py-3"><StatusBadge status={proj.build_status} /></td>
                    <td className="text-center px-4 py-3">
                      <span className={proj.lint_errors === 0 ? 'text-emerald-400' : 'text-amber-400'}>{proj.lint_errors ?? '—'}</span>
                    </td>
                    <td className="text-center px-4 py-3">
                      {proj.test_total != null ? (
                        <span className={proj.test_failed === 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {proj.test_passed}/{proj.test_total}
                          <span className="text-md-on-surface-variant ml-1">({proj.test_pass_rate ?? Math.round((proj.test_passed / proj.test_total) * 100)}%)</span>
                        </span>
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
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-md-on-surface-variant">No projects match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Panel */}
      <ProjectPanel projectId={selectedProject} onClose={() => setSelectedProject(null)} />

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slideIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}
