import { useEffect, useState, useCallback, Fragment } from 'react'
import { Link } from 'react-router-dom'
import QAStatusCard from '../components/qa/QAStatusCard'
import TrendSparkline from '../components/qa/TrendSparkline'

const API_BASE = import.meta.env.VITE_API_URL || ''

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' }
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

function StatusBadge({ status }) {
  const color = status === 'success' ? 'bg-emerald-500/20 text-[#33ff00]' : status === 'failure' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-500/20 text-zinc-400'
  const label = status === 'success' ? 'Passing' : status === 'failure' ? 'Failing' : 'Unknown'
  return <span className={`px-2 py-0.5 rounded-none text-xs font-mono font-medium ${color}`}>{label}</span>
}

function SeverityBadge({ project }) {
  const p = project
  const passRate = p.test_total > 0 ? (p.test_passed / p.test_total) * 100 : 100
  const coverage = p.test_coverage ?? 100
  const healthScore = p.health_score ?? 100
  const lint = p.lint_errors ?? 0

  if (healthScore < 60 || lint > 5 || passRate < 70 || coverage < 60) {
    return <span className="px-2 py-0.5 rounded-none text-xs font-mono font-medium bg-red-500/20 text-red-400">🚨 Critical</span>
  }
  if (healthScore < 90 || (lint >= 1 && lint <= 5) || passRate < 90 || coverage < 80) {
    return <span className="px-2 py-0.5 rounded-none text-xs font-mono font-medium bg-amber-500/20 text-amber-400">⚠️ Warning</span>
  }
  return <span className="px-2 py-0.5 rounded-none text-xs font-mono font-medium bg-emerald-500/20 text-[#33ff00]">✅ Healthy</span>
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

function MiniBar({ value, max = 100, color = 'bg-[#33ff00]' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-16 h-1.5 bg-zinc-800 rounded-none overflow-hidden inline-block ml-2 align-middle">
      <div className={`h-full rounded-none ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ── Mock data generators ── */
const MOCK_COVERAGE_FILES = [
  { path: 'src/index.js', coverage: 95, covered: 190, total: 200 },
  { path: 'src/utils/auth.js', coverage: 72, covered: 108, total: 150 },
  { path: 'src/api/client.js', coverage: 88, covered: 220, total: 250 },
  { path: 'src/components/App.jsx', coverage: 64, covered: 96, total: 150 },
  { path: 'src/hooks/useData.js', coverage: 91, covered: 182, total: 200 },
  { path: 'src/services/worker.js', coverage: 55, covered: 55, total: 100 },
  { path: 'lib/helpers.js', coverage: 83, covered: 166, total: 200 },
]

const MOCK_LOG_LINES = [
  '> dante-id@1.0.0 test',
  '> node --experimental-vm-modules node_modules/.bin/jest --coverage',
  '',
  'PASS src/__tests__/utils.test.js',
  '  ✓ parseConfig returns defaults (3 ms)',
  '  ✓ validateInput rejects empty string (1 ms)',
  '  ✓ formatDate handles ISO strings (2 ms)',
  '',
  'PASS src/__tests__/api.test.js',
  '  ✓ fetchProjects returns array (12 ms)',
  '  ✓ handleError logs to console (1 ms)',
  '',
  'FAIL src/__tests__/auth.test.js',
  '  ✕ login with invalid creds returns 401 (5 ms)',
  '  ✓ login with valid creds returns token (8 ms)',
  '  ✕ refresh token handles expiry (3 ms)',
  '',
  '  ● login with invalid creds returns 401',
  '    Error: expected 401 but received 500',
  '      at Object.<anonymous> (src/__tests__/auth.test.js:15:5)',
  '',
  'PASS src/__tests__/components.test.js',
  '  ✓ renders dashboard without crashing (45 ms)',
  '  ✓ status badge shows correct color (2 ms)',
  '',
  'FAIL src/__tests__/build.test.js',
  '  ✕ build output includes sourcemaps (3 ms)',
  '',
  '  ● build output includes sourcemaps',
  '    Error: sourcemap file not found',
  '      at Object.<anonymous> (src/__tests__/build.test.js:8:5)',
  '',
  '> eslint src/ --ext .js,.jsx',
  '  /src/utils/auth.js',
  '    12:5  error  Unexpected var, use let or const  no-var',
  '    45:10 error  \'unused\' is defined but never used  no-unused-vars',
  '',
  '✨ 2 errors and 0 warnings found.',
  '',
  'Test Suites: 2 failed, 3 passed, 5 total',
  'Tests:       3 failed, 7 passed, 10 total',
  'Snapshots:   0 total',
  'Time:        4.231 s',
  'Ran all test suites.',
  '',
  '> vite build',
  'vite v5.0.0 building for production...',
  '✓ 127 modules transformed.',
  'dist/index.html          0.46 kB │ gzip: 0.30 kB',
  'dist/assets/index.css   12.34 kB │ gzip: 3.21 kB',
  'dist/assets/index.js   145.67 kB │ gzip: 47.89 kB',
  '✓ built in 2.34s',
]

function generateTrendData() {
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 30) + 70)
}

/* ── Slide-out Detail Panel ── */
function ProjectPanel({ projectId, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [historyFilter, setHistoryFilter] = useState('all')
  const [expandedRun, setExpandedRun] = useState(null)
  const [logSearch, setLogSearch] = useState('')

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    setActiveTab('overview')
    apiFetch(`/api/qa/global/project/${projectId}`)
      .then(setDetail)
      .catch(err => console.error('Detail load error:', err))
      .finally(() => setLoading(false))
  }, [projectId])

  if (!projectId) return null

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'history', label: 'History' },
    { key: 'coverage', label: 'Coverage' },
    { key: 'logs', label: 'Logs' },
  ]

  const filteredRuns = detail?.runs?.filter(r => {
    if (historyFilter === 'passing') return r.build_status === 'success'
    if (historyFilter === 'failing') return r.build_status === 'failure'
    return true
  }) || []

  const logLines = MOCK_LOG_LINES.filter(l => !logSearch || l.toLowerCase().includes(logSearch.toLowerCase()))

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-[#0a0a0a] z-50 border-l border-[#333] overflow-y-auto animate-slide-in font-mono">
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#333] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[#33ff00] font-semibold text-lg truncate pr-4 uppercase tracking-wider">
            {loading ? 'Loading…' : `> ${(detail?.project?.name || 'Project').toUpperCase()}`}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-[#33ff00] text-xl leading-none">✕</button>
        </div>

        {/* Tab Bar */}
        {!loading && detail && (
          <div className="sticky top-[57px] bg-[#0a0a0a] z-10 flex border-b border-[#333] px-6">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2.5 text-sm font-mono uppercase tracking-wider transition-colors ${activeTab === t.key ? 'border-b-2 border-[#33ff00] text-[#33ff00]' : 'text-zinc-500 hover:text-zinc-300'}`}>
                [{t.label}]
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="p-6 text-zinc-400 text-sm animate-pulse font-mono">Loading project details…</div>
        ) : !detail ? (
          <div className="p-6 text-zinc-400 text-sm font-mono">Failed to load project data.</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* ── Overview Tab ── */}
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#111] border border-[#333] rounded-none p-4">
                    <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Build Status</div>
                    <StatusBadge status={detail.latest?.build_status} />
                  </div>
                  <div className="bg-[#111] border border-[#333] rounded-none p-4">
                    <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Project Status</div>
                    <span className="text-zinc-100 text-sm font-medium">{detail.project?.status || '—'}</span>
                  </div>
                  <div className="bg-[#111] border border-[#333] rounded-none p-4">
                    <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Tests</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${detail.latest?.test_failed === 0 ? 'text-[#33ff00]' : 'text-red-400'}`}>
                        {detail.latest?.test_passed ?? '—'}/{detail.latest?.test_total ?? '—'}
                      </span>
                      {detail.latest?.test_total > 0 && (
                        <span className="text-zinc-500 text-xs">
                          ({Math.round((detail.latest.test_passed / detail.latest.test_total) * 100)}%)
                        </span>
                      )}
                    </div>
                    <TrendSparkline data={generateTrendData()} color={detail.latest?.test_failed === 0 ? 'emerald' : 'red'} />
                  </div>
                  <div className="bg-[#111] border border-[#333] rounded-none p-4">
                    <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Coverage</div>
                    <span className={`text-lg font-bold ${(detail.latest?.test_coverage ?? 0) >= 80 ? 'text-[#33ff00]' : 'text-amber-400'}`}>
                      {detail.latest?.test_coverage != null ? `${detail.latest.test_coverage}%` : '—'}
                    </span>
                    <TrendSparkline data={generateTrendData()} color={(detail.latest?.test_coverage ?? 0) >= 80 ? 'emerald' : 'amber'} />
                  </div>
                  <div className="bg-[#111] border border-[#333] rounded-none p-4">
                    <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Lint Errors</div>
                    <span className={`text-lg font-bold ${detail.latest?.lint_errors === 0 ? 'text-[#33ff00]' : 'text-amber-400'}`}>
                      {detail.latest?.lint_errors ?? '—'}
                    </span>
                    <TrendSparkline data={generateTrendData()} color={detail.latest?.lint_errors === 0 ? 'emerald' : 'amber'} />
                  </div>
                  <div className="bg-[#111] border border-[#333] rounded-none p-4">
                    <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Total Runs</div>
                    <span className="text-lg font-bold text-zinc-100">{detail.run_count}</span>
                    <TrendSparkline data={generateTrendData()} />
                  </div>
                </div>

                {detail.project?.repo_url && (
                  <a href={detail.project.repo_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#33ff00] text-sm hover:underline font-mono">
                    ↗ View on GitHub
                  </a>
                )}

                <div>
                  <h3 className="text-zinc-100 text-sm font-semibold mb-3 uppercase tracking-wider">CI Run History</h3>
                  {detail.runs.length === 0 ? (
                    <p className="text-zinc-500 text-xs">No CI runs recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.runs.map((run, i) => (
                        <div key={run.id || i} className={`flex items-center gap-3 px-3 py-2 rounded-none text-xs ${run.build_status === 'failure' ? 'bg-red-500/10 border border-red-500/20' : 'bg-[#111] border border-[#222]'}`}>
                          <span className={`w-2 h-2 rounded-none flex-shrink-0 ${run.build_status === 'success' ? 'bg-[#33ff00]' : run.build_status === 'failure' ? 'bg-red-500' : 'bg-zinc-500'}`} />
                          <span className="text-zinc-400 w-36 flex-shrink-0">{new Date(run.created_at).toLocaleString()}</span>
                          <span className="text-zinc-100 flex-shrink-0">
                            {run.test_passed}/{run.test_total} tests
                          </span>
                          {run.test_total > 0 && <MiniBar value={run.test_passed} max={run.test_total} color={run.test_failed === 0 ? 'bg-[#33ff00]' : 'bg-red-500'} />}
                          <span className="text-zinc-400 ml-auto flex-shrink-0">
                            {run.test_coverage != null ? `${run.test_coverage}% cov` : ''}
                          </span>
                          {run.lint_errors > 0 && <span className="text-amber-400 flex-shrink-0">{run.lint_errors} lint</span>}
                          {run.commit_sha && (
                            <a href={`https://github.com/dante-alpha-assistant/dante-id-landing/commit/${run.commit_sha}`} target="_blank" rel="noopener noreferrer" className="text-[#33ff00] hover:underline flex-shrink-0 font-mono">
                              {run.commit_sha.slice(0, 7)}
                            </a>
                          )}
                          {run.commit_message && <span className="text-zinc-500 truncate max-w-[120px]" title={run.commit_message}>{run.commit_message.slice(0, 40)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── History Tab ── */}
            {activeTab === 'history' && (
              <>
                <div className="flex gap-2 mb-4">
                  {['all', 'passing', 'failing'].map(f => (
                    <button key={f} onClick={() => setHistoryFilter(f)}
                      className={`px-3 py-1 rounded-none text-xs font-mono uppercase tracking-wider transition-colors border ${historyFilter === f ? 'border-[#33ff00] text-[#33ff00] bg-[#33ff00]/10' : 'border-[#333] text-zinc-400 hover:text-zinc-200'}`}>
                      [{f}]
                    </button>
                  ))}
                </div>
                <div className="bg-[#111] rounded-none overflow-hidden border border-[#333]">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-zinc-400 uppercase tracking-wider border-b border-[#333]">
                        <th className="text-left px-3 py-2">Run #</th>
                        <th className="text-left px-3 py-2">Date</th>
                        <th className="text-center px-3 py-2">Status</th>
                        <th className="text-center px-3 py-2">Tests</th>
                        <th className="text-right px-3 py-2">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRuns.map((run, i) => (
                        <Fragment key={run.id || i}>
                          <tr className={`border-b border-[#222] cursor-pointer hover:bg-[#1a1a1a] transition-colors ${run.build_status === 'failure' ? 'bg-red-500/5' : ''}`}
                            onClick={() => setExpandedRun(expandedRun === i ? null : i)}>
                            <td className="px-3 py-2 text-zinc-100 font-mono">#{filteredRuns.length - i}</td>
                            <td className="px-3 py-2 text-zinc-400">{new Date(run.created_at).toLocaleString()}</td>
                            <td className="px-3 py-2 text-center"><StatusBadge status={run.build_status} /></td>
                            <td className="px-3 py-2 text-center text-zinc-100">{run.test_passed}/{run.test_total}</td>
                            <td className="px-3 py-2 text-right text-zinc-400">{run.duration ? `${run.duration}s` : '~4s'}</td>
                          </tr>
                          {expandedRun === i && run.build_status === 'failure' && (
                            <tr>
                              <td colSpan={5} className="px-3 py-2 bg-red-500/5 text-red-400 text-xs">
                                Failed tests: test_auth, test_build{run.test_failed > 2 ? `, test_integration (+${run.test_failed - 3} more)` : ''}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                      {filteredRuns.length === 0 && (
                        <tr><td colSpan={5} className="px-3 py-6 text-center text-zinc-500">No runs match this filter.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Coverage Tab ── */}
            {activeTab === 'coverage' && (
              <>
                <div className="text-center py-4">
                  <div className="text-zinc-400 text-xs uppercase tracking-wider mb-2">Overall Coverage</div>
                  <span className={`text-5xl font-bold font-mono ${(detail.latest?.test_coverage ?? 0) >= 80 ? 'text-[#33ff00]' : 'text-amber-400'}`}>
                    {detail.latest?.test_coverage != null ? `${detail.latest.test_coverage}%` : '—'}
                  </span>
                </div>
                {detail.latest?.test_coverage != null ? (
                  <div className="bg-[#111] rounded-none overflow-hidden border border-[#333]">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="text-zinc-400 uppercase tracking-wider border-b border-[#333]">
                          <th className="text-left px-3 py-2">File Path</th>
                          <th className="text-center px-3 py-2">Coverage %</th>
                          <th className="text-right px-3 py-2">Lines</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_COVERAGE_FILES.map((f, i) => (
                          <tr key={i} className="border-b border-[#222]">
                            <td className={`px-3 py-2 font-mono ${f.coverage < 80 ? 'text-red-400' : 'text-zinc-100'}`}>{f.path}</td>
                            <td className={`px-3 py-2 text-center font-medium ${f.coverage < 80 ? 'text-red-400' : 'text-[#33ff00]'}`}>{f.coverage}%</td>
                            <td className="px-3 py-2 text-right text-zinc-400">{f.covered}/{f.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-zinc-400 text-sm text-center font-mono">Coverage data not available for this project</p>
                )}
              </>
            )}

            {/* ── Logs Tab ── */}
            {activeTab === 'logs' && (
              <>
                <input type="text" placeholder="Search logs…" value={logSearch} onChange={e => setLogSearch(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] rounded-none px-3 py-2 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#33ff00] mb-3" />
                <div className="bg-[#0a0a0a] text-zinc-100 font-mono text-xs p-4 rounded-none border border-[#333] overflow-auto max-h-[60vh]">
                  {logLines.map((line, i) => {
                    const isError = /error|Error|FAIL/.test(line)
                    const isPass = /pass|PASS|✓/.test(line)
                    return (
                      <div key={i} className={`${isError ? 'bg-red-900/30' : ''} ${isPass ? 'text-[#33ff00]' : ''}`}>
                        {line || '\u00A0'}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
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
      {open && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onToggle} />}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-60
        bg-[#0a0a0a] border-r border-[#333]
        flex flex-col transition-transform duration-200 font-mono
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Nav */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <div key={item.label}
              className={`flex items-center gap-3 px-3 py-2 rounded-none text-sm cursor-pointer transition-colors ${
                item.active
                  ? 'bg-[#111] text-[#33ff00] font-medium border border-[#333]'
                  : 'text-zinc-500 hover:bg-[#111] hover:text-zinc-300'
              }`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <hr className="border-[#333] mx-4" />

        {/* Status filters */}
        <div className="p-4">
          <div className="text-zinc-400 text-xs uppercase tracking-wider mb-2 font-medium">Status</div>
          {['passing', 'failing', 'warning'].map(key => (
            <label key={key} className="flex items-center gap-2 px-2 py-1 text-sm text-zinc-300 cursor-pointer hover:bg-[#111] rounded-none">
              <input type="checkbox" checked={statusFilters[key]} onChange={() => toggleStatus(key)}
                className="accent-[#33ff00] w-3.5 h-3.5" />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>

        <hr className="border-[#333] mx-4" />

        {/* Severity filters */}
        <div className="p-4">
          <div className="text-zinc-400 text-xs uppercase tracking-wider mb-2 font-medium">Severity</div>
          {['critical', 'warning', 'healthy'].map(key => (
            <label key={key} className="flex items-center gap-2 px-2 py-1 text-sm text-zinc-300 cursor-pointer hover:bg-[#111] rounded-none">
              <input type="checkbox" checked={severityFilters[key]} onChange={() => toggleSeverity(key)}
                className="accent-[#33ff00] w-3.5 h-3.5" />
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
        <div className="text-[#33ff00] text-sm animate-pulse">Loading QA Dashboard...</div>
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
    <div className="flex h-screen bg-[#0a0a0a] text-zinc-100 font-mono">
      <Sidebar
        statusFilters={statusFilters} setStatusFilters={setStatusFilters}
        severityFilters={severityFilters} setSeverityFilters={setSeverityFilters}
        open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)}
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Mobile hamburger */}
        <button onClick={() => setSidebarOpen(o => !o)}
          className="lg:hidden mb-4 p-2 rounded-none border border-[#333] text-zinc-400 hover:bg-[#111]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[#33ff00] text-2xl font-bold tracking-wider uppercase">&gt; QA_DASHBOARD</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Platform-wide quality metrics across all projects</p>
          </div>
          <button onClick={load} className="border border-[#33ff00] text-[#33ff00] bg-transparent hover:bg-[#33ff00]/10 rounded-none px-4 py-2 font-mono text-sm">[ ↻ Refresh ]</button>
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
        <div className="bg-[#111] rounded-none border border-[#333] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between">
            <div>
              <h2 className="text-[#33ff00] text-sm font-semibold uppercase tracking-wider">Projects</h2>
              <p className="text-zinc-500 text-xs">{filtered.length} of {projects.length} projects</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="text-zinc-400 text-xs uppercase tracking-wider border-b border-[#333]">
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
                      className={`border-b border-[#222] hover:bg-[#1a1a1a] transition-colors cursor-pointer ${critical ? 'border-l-4 border-l-red-500 bg-red-500/5' : ''}`}
                      onClick={() => setSelectedProject(proj.project_id)}>
                      <td className="px-4 py-3">
                        <div className="text-zinc-100 font-medium">{proj.project_name}</div>
                        {proj.project_status && <div className="text-zinc-500 text-xs">{proj.project_status}</div>}
                        {critical && proj.consecutive_failures > 0 && (
                          <div className="text-red-400 text-xs mt-0.5">🔥 {proj.consecutive_failures} consecutive failures</div>
                        )}
                      </td>
                      <td className="text-center px-4 py-3"><SeverityBadge project={proj} /></td>
                      <td className="text-center px-4 py-3"><StatusBadge status={proj.build_status} /></td>
                      <td className="text-center px-4 py-3">
                        <span className={proj.lint_errors === 0 ? 'text-[#33ff00]' : 'text-amber-400'}>{proj.lint_errors ?? '—'}</span>
                      </td>
                      <td className="text-center px-4 py-3">
                        {proj.test_total != null ? (
                          <span className={proj.test_failed === 0 ? 'text-[#33ff00]' : 'text-red-400'}>
                            {proj.test_passed}/{proj.test_total}
                            <span className="text-zinc-500 ml-1">({proj.test_pass_rate ?? Math.round((proj.test_passed / proj.test_total) * 100)}%)</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="text-center px-4 py-3">
                        {proj.test_coverage != null ? (
                          <span className={proj.test_coverage >= 80 ? 'text-[#33ff00]' : 'text-amber-400'}>{proj.test_coverage}%</span>
                        ) : '—'}
                      </td>
                      <td className="text-center px-4 py-3 text-zinc-400">{proj.run_count}</td>
                      <td className="text-right px-4 py-3 text-zinc-500 text-xs">
                        {proj.last_run ? new Date(proj.last_run).toLocaleString() : '—'}
                      </td>
                      <td className="text-center px-4 py-3">
                        {critical && (
                          <Link to={`/qa/${proj.project_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="border border-red-500 text-red-400 px-2 py-0.5 rounded-none text-xs hover:bg-red-500/10 whitespace-nowrap font-mono">
                            [ Debug Now ]
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-zinc-500">No projects match this filter.</td></tr>
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
