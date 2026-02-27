import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tabs, TabList, Tab, TabPanel } from '../components/qa/Tabs'
import Sparkline from '../components/qa/Sparkline'
import TestHistoryTab from '../components/qa/TestHistoryTab'
import CoverageTab from '../components/qa/CoverageTab'
import LogsTab from '../components/qa/LogsTab'
import PipelineFlow from '../components/qa/PipelineFlow'
import FailureDetail from '../components/qa/FailureDetail'
import SituationRoom from '../components/qa/SituationRoom'

const API_BASE = import.meta.env.VITE_API_URL || ''

function StatusBadge({ status, large }) {
  const color = status === 'success' ? 'bg-emerald-500/20 text-[#33ff00]' : status === 'failure' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-500/20 text-zinc-400'
  const label = status === 'success' ? 'Passing' : status === 'failure' ? 'Failing' : 'Unknown'
  const size = large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
  return <span className={`${size} rounded-none font-mono font-medium ${color}`}>{label}</span>
}

function MetricCard({ title, sparkData, sparkInvert, children }) {
  return (
    <div className="bg-[#111] border border-[#333] rounded-none p-5">
      <div className="text-zinc-400 text-sm mb-2 font-mono uppercase tracking-wider">{title}</div>
      <div className="flex items-center justify-between">
        <div>{children}</div>
        {sparkData && sparkData.length > 1 && (
          <Sparkline data={sparkData} invert={sparkInvert} />
        )}
      </div>
    </div>
  )
}

function ComingSoon({ label }) {
  return (
    <div className="flex items-center justify-center py-20 text-zinc-500 font-mono">
      <p className="text-lg">{label} — Coming soon</p>
    </div>
  )
}

export default function QAProjectDetail() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [sparklines, setSparklines] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retrying, setRetrying] = useState(false)
  const [failures, setFailures] = useState(null)
  const [flakyTests, setFlakyTests] = useState(null)
  const [debugMode, setDebugMode] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [res, sparkRes] = await Promise.all([
        fetch(`${API_BASE}/api/qa/global/project/${project_id}`),
        fetch(`${API_BASE}/api/qa/global/project/${project_id}/sparkline`).catch(() => null),
      ])
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      if (sparkRes && sparkRes.ok) {
        setSparklines(await sparkRes.json())
      }
      fetch(`${API_BASE}/api/qa/global/project/${project_id}/failures`).then(r => r.json()).then(setFailures).catch(() => {})
      fetch(`${API_BASE}/api/qa/flaky-tests/${project_id}`).then(r => r.json()).then(d => setFlakyTests(d.flaky_tests || [])).catch(() => {})
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [project_id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRetry = async () => {
    setRetrying(true)
    try {
      await fetch(`${API_BASE}/api/qa/global/project/${project_id}/retry`, { method: 'POST' })
      await fetchData()
    } finally {
      setRetrying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex items-center justify-center font-mono">
        <div className="text-[#33ff00] animate-pulse text-lg">Loading project…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex items-center justify-center font-mono">
        <div className="text-red-400">Error: {error}</div>
      </div>
    )
  }

  const { project, latest, runs, run_count } = data
  const testPct = latest && latest.test_total > 0 ? Math.round((latest.test_passed / latest.test_total) * 100) : 0
  const coveragePct = latest ? Math.round(latest.test_coverage ?? 0) : 0
  const displayRuns = (runs || []).slice(0, 20)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-mono">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <button onClick={() => navigate('/qa/dashboard')} className="text-[#33ff00] hover:underline text-sm mb-6 inline-flex items-center gap-1">
          ← QA_DASHBOARD <span className="text-zinc-500">/ {project.name}</span>
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-[#33ff00] uppercase tracking-wider">&gt; {project.name}</h1>
            <StatusBadge status={project.status} large />
          </div>
          <p className="text-zinc-500 text-sm">{run_count} CI run{run_count !== 1 ? 's' : ''} recorded</p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3 mb-6">
          {project.pr_url && (
            <a
              href={project.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#33ff00] text-[#33ff00] bg-transparent hover:bg-[#33ff00]/10 rounded-none px-4 py-2 text-sm font-mono"
            >
              [ View PR ]
            </a>
          )}
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="border border-[#33ff00] text-[#33ff00] bg-transparent hover:bg-[#33ff00]/10 rounded-none px-4 py-2 text-sm font-mono disabled:opacity-50 transition-colors"
          >
            {retrying ? '[ Running… ]' : '[ Re-run CI ]'}
          </button>
          <button className="border border-[#333] text-zinc-400 hover:text-zinc-200 rounded-none px-4 py-2 text-sm font-mono transition-colors">
            [ Download Logs ]
          </button>
          <button
            onClick={() => setDebugMode(v => !v)}
            className={`rounded-none px-4 py-2 text-sm font-mono transition-colors ${debugMode ? 'bg-red-600 text-white border border-red-600 hover:bg-red-700' : 'border border-red-500 text-red-400 hover:bg-red-500/10'}`}
          >
            {debugMode ? '[ ✕ Close Debug ]' : '[ 🔍 Debug Now ]'}
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultTab="overview">
          <TabList>
            <Tab value="overview">Overview</Tab>
            <Tab value="history">Test History</Tab>
            <Tab value="coverage">Coverage</Tab>
            <Tab value="logs">Logs</Tab>
          </TabList>

          <TabPanel value="overview">
            {/* Pipeline Flow */}
            <PipelineFlow latest={latest} />

            {/* Failure Detail / Situation Room */}
            {debugMode ? (
              <div className="my-4">
                <SituationRoom
                  projectName={project.name}
                  failure={{
                    type: latest?.build_status === 'failure' ? 'build' : 'test',
                    errors: (failures?.errors || []).slice(0, 5).map(e => ({
                      name: e.test_name || 'Error',
                      message: e.error_message || e.message || '',
                      file: e.file || null,
                      line: e.line || null,
                    })),
                    raw_log: failures?.raw_log || 'No raw log available.',
                  }}
                  codeContext={{
                    file: 'src/index.js',
                    line: 42,
                    diff: [
                      ' import { render } from "react-dom"',
                      '-import App from "./OldApp"',
                      '+import App from "./App"',
                      ' ',
                      ' render(<App />, document.getElementById("root"))',
                    ].join('\n'),
                  }}
                  aiAnalysis={{
                    rootCause: 'Placeholder — AI analysis will appear here when connected.',
                    suggestedFix: null,
                  }}
                  impactRadius={{ dependentProjects: 3, affectedTests: 12 }}
                />
              </div>
            ) : (
              <FailureDetail failures={failures} latest={latest} />
            )}

            {/* CI Run History */}
            <div className="bg-[#111] border border-[#333] rounded-none overflow-hidden">
              <div className="px-5 py-3 border-b border-[#333]">
                <h2 className="text-[#33ff00] font-semibold uppercase tracking-wider">CI Run History</h2>
                <div className="flex gap-1 mt-2">
                  {displayRuns.map((run, i) => (
                    <div key={i} className={`w-2 h-2 rounded-none ${run.build_status === 'success' ? 'bg-[#33ff00]' : 'bg-red-500'}`}
                         title={new Date(run.created_at).toLocaleDateString()} />
                  ))}
                </div>
              </div>
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="text-zinc-400 text-left uppercase tracking-wider border-b border-[#333]">
                    <th className="px-5 py-2 font-medium">Date</th>
                    <th className="px-5 py-2 font-medium">Commit</th>
                    <th className="px-5 py-2 font-medium">Author</th>
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
                      <tr key={run.id} className={`border-b border-[#222] ${failed ? 'bg-red-500/10' : ''}`}>
                        <td className="px-5 py-2 text-zinc-400">{new Date(run.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-2 font-mono text-xs">
                          {run.commit_sha ? (
                            <a href={`https://github.com/dante-alpha-assistant/dante-id-landing/commit/${run.commit_sha}`} target="_blank" rel="noopener noreferrer" className="text-[#33ff00] hover:underline" title={run.commit_message || ''}>
                              {run.commit_sha.slice(0, 7)}
                            </a>
                          ) : <span className="text-zinc-600">—</span>}
                          {run.commit_message && <span className="ml-1 text-zinc-500">{run.commit_message.length > 60 ? run.commit_message.slice(0, 60) + '…' : run.commit_message}</span>}
                        </td>
                        <td className="px-5 py-2 text-xs text-zinc-400">{run.commit_author || '—'}</td>
                        <td className="px-5 py-2"><StatusBadge status={run.build_status} /></td>
                        <td className="px-5 py-2">{run.test_passed}/{run.test_total} ({runTestPct}%)</td>
                        <td className="px-5 py-2">{Math.round(run.test_coverage ?? 0)}%</td>
                        <td className="px-5 py-2">{run.lint_errors}</td>
                      </tr>
                    )
                  })}
                  {displayRuns.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-4 text-center text-zinc-500">No runs yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabPanel>

          <TabPanel value="history">
            <TestHistoryTab projectId={project_id} />
          </TabPanel>

          <TabPanel value="coverage">
            <CoverageTab projectId={project_id} />
          </TabPanel>

          <TabPanel value="logs">
            <LogsTab projectId={project_id} />
          </TabPanel>
        </Tabs>

        {/* Flaky Tests Section */}
        <div className="mt-6 bg-[#111] border border-[#333] rounded-none p-4">
          <h3 className="text-lg font-semibold text-amber-400 mb-3 uppercase tracking-wider">🔀 Flaky Tests</h3>
          {flakyTests === null ? (
            <p className="text-zinc-500 text-sm">Loading...</p>
          ) : flakyTests.length === 0 ? (
            <p className="text-zinc-500 text-sm">No flaky tests detected</p>
          ) : (
            <div className="space-y-2">
              {flakyTests.map((t, i) => (
                <div key={i} className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-none p-3">
                  <div className="flex-1">
                    <span className="text-zinc-100 text-sm font-medium">{t.test_name}</span>
                    {t.category && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-none bg-amber-500/20 text-amber-300">{t.category}</span>
                    )}
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-none bg-orange-500/20 text-orange-300">
                      {t.flip_count} flip{t.flip_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {t.last_5_statuses.map((s, j) => (
                      <span key={j} className={`w-3 h-3 rounded-none ${s === 'pass' ? 'bg-[#33ff00]' : s === 'fail' ? 'bg-red-500' : 'bg-yellow-500'}`} title={s} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
