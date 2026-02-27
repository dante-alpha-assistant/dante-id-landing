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
  const color = status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : status === 'failure' ? 'bg-red-500/20 text-red-400' : 'bg-zinc-500/20 text-zinc-400'
  const label = status === 'success' ? 'Passing' : status === 'failure' ? 'Failing' : 'Unknown'
  const size = large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
  return <span className={`${size} rounded-full font-medium ${color}`}>{label}</span>
}

function MetricCard({ title, sparkData, sparkInvert, children }) {
  return (
    <div className="bg-md-surface-container border border-md-outline-variant rounded-md-lg p-5">
      <div className="text-md-on-surface-variant text-sm mb-2">{title}</div>
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
    <div className="flex items-center justify-center py-20 text-md-on-surface-variant">
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
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-md-on-background">{project.name}</h1>
            <StatusBadge status={project.status} large />
          </div>
          <p className="text-md-on-surface-variant text-sm">{run_count} CI run{run_count !== 1 ? 's' : ''} recorded</p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3 mb-6">
          {project.pr_url && (
            <a
              href={project.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm rounded-md border border-md-outline-variant text-md-on-background hover:bg-md-surface-container transition-colors"
            >
              View PR
            </a>
          )}
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-4 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {retrying ? 'Running…' : 'Re-run CI'}
          </button>
          <button className="px-4 py-2 text-sm rounded-md text-md-on-surface-variant hover:text-md-on-background transition-colors">
            Download Logs
          </button>
          <button
            onClick={() => setDebugMode(v => !v)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${debugMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-zinc-800 text-red-400 border border-red-500/30 hover:bg-zinc-700'}`}
          >
            {debugMode ? '✕ Close Debug' : '🔍 Debug Now'}
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
            <div className="bg-md-surface-container border border-md-outline-variant rounded-md-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-md-outline-variant">
                <h2 className="text-md-on-background font-semibold">CI Run History</h2>
                <div className="flex gap-1 mt-2">
                  {displayRuns.map((run, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${run.build_status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
                         title={new Date(run.created_at).toLocaleDateString()} />
                  ))}
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-md-on-surface-variant text-left border-b border-md-outline-variant">
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
                      <tr key={run.id} className={`border-b border-md-outline-variant ${failed ? 'bg-red-500/10' : ''}`}>
                        <td className="px-5 py-2 text-md-on-surface-variant">{new Date(run.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-2 font-mono text-xs">
                          {run.commit_sha ? (
                            <a href={`https://github.com/dante-alpha-assistant/dante-id-landing/commit/${run.commit_sha}`} target="_blank" rel="noopener noreferrer" className="text-md-primary hover:underline" title={run.commit_message || ''}>
                              {run.commit_sha.slice(0, 7)}
                            </a>
                          ) : <span className="text-zinc-500">—</span>}
                          {run.commit_message && <span className="ml-1 text-zinc-400 font-sans">{run.commit_message.length > 60 ? run.commit_message.slice(0, 60) + '…' : run.commit_message}</span>}
                        </td>
                        <td className="px-5 py-2 text-xs text-md-on-surface-variant">{run.commit_author || '—'}</td>
                        <td className="px-5 py-2"><StatusBadge status={run.build_status} /></td>
                        <td className="px-5 py-2">{run.test_passed}/{run.test_total} ({runTestPct}%)</td>
                        <td className="px-5 py-2">{Math.round(run.test_coverage ?? 0)}%</td>
                        <td className="px-5 py-2">{run.lint_errors}</td>
                      </tr>
                    )
                  })}
                  {displayRuns.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-4 text-center text-md-on-surface-variant">No runs yet</td></tr>
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
        <div className="mt-6 bg-zinc-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-amber-400 mb-3">🔀 Flaky Tests</h3>
          {flakyTests === null ? (
            <p className="text-zinc-400 text-sm">Loading...</p>
          ) : flakyTests.length === 0 ? (
            <p className="text-zinc-400 text-sm">No flaky tests detected</p>
          ) : (
            <div className="space-y-2">
              {flakyTests.map((t, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-700 rounded p-3">
                  <div className="flex-1">
                    <span className="text-white text-sm font-medium">{t.test_name}</span>
                    {t.category && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300">{t.category}</span>
                    )}
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-500/20 text-orange-300">
                      {t.flip_count} flip{t.flip_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {t.last_5_statuses.map((s, j) => (
                      <span key={j} className={`w-3 h-3 rounded-full ${s === 'pass' ? 'bg-green-500' : s === 'fail' ? 'bg-red-500' : 'bg-yellow-500'}`} title={s} />
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
