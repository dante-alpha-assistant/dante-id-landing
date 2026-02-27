import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
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
  const p = project
  const passRate = p.test_total > 0 ? (p.test_passed / p.test_total) * 100 : 100
  const coverage = p.test_coverage ?? 100
  const healthScore = p.health_score ?? 100
  const lint = p.lint_errors ?? 0

  // FAIL
  if (healthScore < 60 || lint > 5 || passRate < 70 || coverage < 60) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">🚨 Critical</span>
  }
  // WARNING
  if (healthScore < 90 || (lint >= 1 && lint <= 5) || passRate < 90 || coverage < 80) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">⚠️ Warning</span>
  }
  // PASS
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">✅ Healthy</span>
}

function getSeverity(proj) {
  const passRate = proj.test_total > 0 ? (proj.test_passed / proj.test_total) * 100 : 100
  const coverage = proj.test_coverage ?? 100
  const healthScore = proj.health_score ?? 100
  const lint = proj.lint_errors ?? 0

  if (healthScore < 60 || lint > 5 || passRate < 70 || coverage < 60) return 'critical'
  if (healthScore < 90 || (lint >= 1 && lint <= 5) || passRate < 90 || coverage < 80) return 'warning'
  return 'healthy'
}

function getStatusCategory(proj) {
  if (proj.build_status === 'success') return 'passing'
  if (proj.build_status === 'failure') return 'failing'
  return 'warning'
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
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />
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

            {detail.project?.repo_url && (
              <a href={detail.project.repo_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-md-primary text-sm hover:underline">
                ↗ View on GitHub
              </a>
            )}

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

/* ── Sidebar ── */
const NAV_ITEMS = [
  { label: 'Overview', icon: '📊', active: true },
  { label: 'Projects', icon: '📁', active: false },
  { label: 'Trends', icon: '📈', active: false },
  { label: 'Alerts', icon: '🔔', active: false },
  { label: 'Settings', icon: '⚙️', active: false },
]

function Sidebar({ statusFilters, setStatusFilters, severityFilters, setSeverityFilters, open, onToggle }) {
  const toggleStatus = (key) => setStatusFilters(prev => ({ ...prev, [key]: !prev[key] }))
  const toggleSeverity = (key) => setSeverityFilters(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onToggle} />}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-60
        bg-md-surface-container border-r border-md-outline-variant
        flex flex-col transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Nav */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <div key={item.label}
              className={`flex items-center gap-3 px-3 py-2 rounded-md-lg text-sm cursor-pointer transition-colors ${
                item.active
                  ? 'bg-md-surface-container-high text-md-on-background font-medium'
                  : 'text-md-on-surface-variant hover:bg-md-surface-container-high/50'
              }`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <hr className="border-md-outline-variant mx-4" />

        {/* Status filters */}
        <div className="p-4">
          <div className="text-md-on-surface-variant text-xs uppercase tracking-wider mb-2 font-medium">Status</div>
          {['passing', 'failing', 'warning'].map(key => (
            <label key={key} className="flex items-center gap-2 px-2 py-1 text-sm text-md-on-surface cursor-pointer hover:bg-md-surface-container-high/50 rounded">
              <input type="checkbox" checked={statusFilters[key]} onChange={() => toggleStatus(key)}
                className="accent-emerald-500 w-3.5 h-3.5" />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>

        <hr className="border-md-outline-variant mx-4" />

        {/* Severity filters */}
        <div className="p-4">
          <div className="text-md-on-surface-variant text-xs uppercase tracking-wider mb-2 font-medium">Severity</div>
          {['critical', 'warning', 'healthy'].map(key => (
            <label key={key} className="flex items-center gap-2 px-2 py-1 text-sm text-md-on-surface cursor-pointer hover:bg-md-surface-container-high/50 rounded">
              <input type="checkbox" checked={severityFilters[key]} onChange={() => toggleSeverity(key)}
                className="accent-emerald-500 w-3.5 h-3.5" />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>
      </aside>
    </>
  )
}

function isCriticalProject(proj) {
  return proj.build_status === 'failure' || (proj.health_score != null && proj.health_score < 60)
}

export default function QADashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statusFilters, setStatusFilters] = useState({ passing: true, failing: true, warning: true })
  const [severityFilters, setSeverityFilters] = useState({ critical: true, warning: true, healthy: true })

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
  const filtered = projects.filter(pr => {
    const sev = getSeverity(pr)
    const status = getStatusCategory(pr)
    return severityFilters[sev] && statusFilters[status]
  })

  return (
    <div className="flex h-screen bg-md-background text-md-on-background">
      <Sidebar
        statusFilters={statusFilters} setStatusFilters={setStatusFilters}
        severityFilters={severityFilters} setSeverityFilters={setSeverityFilters}
        open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)}
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Mobile hamburger */}
        <button onClick={() => setSidebarOpen(o => !o)}
          className="lg:hidden mb-4 p-2 rounded-md-lg border border-md-outline-variant text-md-on-surface-variant hover:bg-md-surface-container-high">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

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
                  <th className="text-center px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((proj, i) => {
                  const critical = isCriticalProject(proj)
                  return (
                    <tr key={proj.project_id || i}
                      className={`border-b border-md-outline-variant/50 hover:bg-md-surface-container-high transition-colors cursor-pointer ${critical ? 'border-l-4 border-l-red-500 bg-red-500/5' : ''}`}
                      onClick={() => setSelectedProject(proj.project_id)}>
                      <td className="px-4 py-3">
                        <div className="text-md-on-background font-medium">{proj.project_name}</div>
                        {proj.project_status && <div className="text-md-on-surface-variant text-xs">{proj.project_status}</div>}
                        {critical && proj.consecutive_failures > 0 && (
                          <div className="text-red-400 text-xs mt-0.5">🔥 {proj.consecutive_failures} consecutive failures</div>
                        )}
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
                      <td className="text-center px-4 py-3">
                        {critical && (
                          <Link to={`/qa/${proj.project_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="border border-red-500 text-red-400 px-2 py-0.5 rounded text-xs hover:bg-red-500/10 whitespace-nowrap">
                            Debug Now
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-md-on-surface-variant">No projects match this filter.</td></tr>
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
      </main>
    </div>
  )
}
