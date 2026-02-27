import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const API_BASE = '/api/deployer'
const API_REFINERY = '/api/refinery'
const API_BUILDER = '/api/builder'
const API_INSPECTOR = '/api/inspector'

async function apiCall(base, path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  })
  return res.json()
}

const TARGETS = [
  { key: 'vercel', label: 'VERCEL' },
  { key: 'github_pages', label: 'GITHUB' },
  { key: 'custom', label: 'CUSTOM' },
]

export default function Deployer() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [target, setTarget] = useState('vercel')
  const [deployments, setDeployments] = useState([])
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({ features: 0, builds: 0, totalBuilds: 0, testsPassed: 0, testsTotal: 0, qualityGate: true })
  const [qualityGate, setQualityGate] = useState(null)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    try {
      const [featRes, buildRes, testRes] = await Promise.all([
        apiCall(API_REFINERY, `/${project_id}/features`),
        apiCall(API_BUILDER, `/${project_id}/builds`),
        apiCall(API_INSPECTOR, `/${project_id}/results`),
      ])

      const features = featRes.features || []
      const builds = buildRes.builds || []
      const tests = testRes.results || testRes.test_results || []

      const doneBuilds = builds.filter(b => b.status === 'done' || b.status === 'review')
      const passed = tests.filter(t => t.status === 'passed')
      const blockers = tests.filter(t => t.status === 'failed' && t.severity === 'blocker')

      setStats({
        features: features.length,
        builds: doneBuilds.length,
        totalBuilds: features.length,
        testsPassed: passed.length,
        testsTotal: tests.length,
        qualityGate: blockers.length === 0,
      })

      // Fetch enhanced quality gate
      try {
        const gateRes = await apiCall(API_BASE, `/${project_id}/quality-gate`)
        setQualityGate(gateRes)
      } catch (gateErr) {
        console.error('Quality gate fetch failed:', gateErr)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [project_id])

  const fetchDeployments = useCallback(async () => {
    const res = await apiCall(API_BASE, `/${project_id}/deployments`)
    setDeployments(res.deployments || [])
  }, [project_id])

  useEffect(() => {
    Promise.all([fetchStats(), fetchDeployments()]).then(() => setLoading(false))
  }, [fetchStats, fetchDeployments])

  const handleDeploy = async () => {
    if (qualityGate && !qualityGate.passed) return
    setDeploying(true)
    setError(null)
    setLogs([{ timestamp: new Date().toTimeString().split(' ')[0], message: '$ Initiating deployment...' }])

    try {
      const res = await apiCall(API_BASE, '/deploy', {
        method: 'POST',
        body: JSON.stringify({ project_id, target })
      })

      if (res.error) {
        setError(res.error)
        setLogs(prev => [...prev, { timestamp: new Date().toTimeString().split(' ')[0], message: `Error: ${res.error}` }])
      } else {
        setLogs(prev => [
          ...prev,
          { timestamp: new Date().toTimeString().split(' ')[0], message: `$ Deployment complete` },
          { timestamp: new Date().toTimeString().split(' ')[0], message: `$ Live at: ${res.url}` },
          { timestamp: new Date().toTimeString().split(' ')[0], message: '✓ Done' },
        ])
        await fetchDeployments()
      }
    } catch (err) {
      setError(err.message)
      setLogs(prev => [...prev, { timestamp: new Date().toTimeString().split(' ')[0], message: `Fatal: ${err.message}` }])
    }
    setDeploying(false)
  }

  const handleRollback = async (deploymentId) => {
    try {
      await apiCall(API_BASE, '/rollback', {
        method: 'POST',
        body: JSON.stringify({ deployment_id: deploymentId })
      })
      await fetchDeployments()
    } catch (err) {
      console.error('Rollback failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-md-background flex items-center justify-center">
        <div className="text-md-primary animate-pulse">Loading...</div>
      </div>
    )
  }

  const statusColor = (status) => {
    switch (status) {
      case 'live': return 'text-md-primary'
      case 'deploying': return 'text-amber-500 animate-pulse'
      case 'failed': return 'text-red-500'
      case 'rolled_back': return 'text-md-outline'
      default: return 'text-md-on-surface-variant'
    }
  }

  const statusLabel = (status) => {
    switch (status) {
      case 'live': return 'Live'
      case 'deploying': return 'Deploying'
      case 'failed': return 'Failed'
      case 'rolled_back': return 'Rolled Back'
      case 'pending': return 'Pending'
      case 'done': return 'Previous'
      default: return status?.toUpperCase() || 'Unknown'
    }
  }

  return (
    <div className="min-h-screen bg-md-background text-md-on-surface">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-md-outline-variant">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight">dante_</span>
          <span className="text-md-outline">/</span>
          <span className="text-sm text-md-on-surface-variant uppercase">Deployer</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-md-on-surface-variant hover:bg-md-primary hover:text-md-on-primary border border-md-outline-variant px-3 py-1 transition-all ease-md-standard duration-300 uppercase"
        >
          Dashboard
        </button>
      </div>

      <div className="max-w-4xl mx-auto mt-8 px-4 pb-16 space-y-8">
        {/* Quality Gate */}
        <div className="bg-[#111] border border-[#333] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Quality Gate</span>
            {qualityGate && (
              <span className={`px-3 py-1 font-mono text-sm border ${
                qualityGate.passed
                  ? 'border-[#33ff00] text-[#33ff00]'
                  : 'border-red-500 text-red-500'
              }`}>
                {qualityGate.passed ? '[ PASS ]' : '[ BLOCKED ]'}
              </span>
            )}
          </div>

          {qualityGate?.checks?.map((check, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${
                  check.status === 'pass' ? 'bg-[#33ff00]' :
                  check.status === 'warn' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span className="text-zinc-400 font-mono text-sm">{check.name}</span>
              </div>
              <span className={`font-mono text-sm ${
                check.status === 'pass' ? 'text-[#33ff00]' :
                check.status === 'warn' ? 'text-amber-500' : 'text-red-500'
              }`}>{check.detail}</span>
            </div>
          ))}

          {qualityGate?.lastRun && (
            <div className="mt-4 pt-3 border-t border-[#222] text-xs text-zinc-500 font-mono">
              Last CI: {qualityGate.lastRun.commit_sha?.slice(0, 7)} by {qualityGate.lastRun.commit_author} — {qualityGate.lastRun.commit_message?.slice(0, 50)}
            </div>
          )}

          {/* Project stats */}
          <div className="mt-4 pt-3 border-t border-[#222] space-y-1 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-500">Features:</span>
              <span className="text-[#33ff00]">{stats.features}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Builds:</span>
              <span className="text-[#33ff00]">{stats.builds}/{stats.totalBuilds} {stats.builds >= stats.totalBuilds && stats.totalBuilds > 0 ? '✓' : 'Partial'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Inspector:</span>
              <span className="text-[#33ff00]">{stats.testsPassed}/{stats.testsTotal} passed</span>
            </div>
          </div>
        </div>

        {/* Deploy Console */}
        <div className="bg-md-surface-container rounded-md-lg p-6 shadow-sm hover:shadow-md">
          <div className="text-xs text-md-outline mb-4">Deploy Console</div>

          {/* Target selector */}
          <div className="flex gap-2 mb-6">
            {TARGETS.map(t => (
              <button
                key={t.key}
                onClick={() => setTarget(t.key)}
                className={`px-4 py-2 text-sm border transition-all ease-md-standard duration-300 ${
                  target === t.key
                    ? 'bg-md-primary text-md-on-primary border-md-primary'
                    : 'text-md-on-surface-variant border-md-outline-variant hover:border-md-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Deploy button */}
          <button
            onClick={handleDeploy}
            disabled={deploying || (qualityGate && !qualityGate.passed)}
            className={`w-full py-4 text-lg border font-mono transition-all ease-md-standard duration-300 mb-6 ${
              (qualityGate && !qualityGate.passed)
                ? 'border-red-500 text-red-500 cursor-not-allowed'
                : deploying
                  ? 'border-amber-500 text-amber-500 animate-pulse cursor-wait'
                  : 'border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-black'
            }`}
          >
            {deploying ? '[ Deploying... ]' : (qualityGate && !qualityGate.passed) ? '[ Deploy Blocked ]' : '[ Deploy ]'}
          </button>

          {error && (
            <div className="mb-4 p-3 border border-red-500 text-red-500 text-sm">
              Error: {error}
            </div>
          )}

          {/* Log output */}
          {logs.length > 0 && (
            <div className="bg-md-background border border-md-outline-variant rounded-md-lg p-4 max-h-64 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className={`text-xs ${log.message.includes('[ERROR]') || log.message.includes('[FATAL]') ? 'text-red-500' : log.message.includes('✓ Done') ? 'text-md-primary font-bold' : 'text-md-on-surface-variant'}`}>
                  <span className="text-md-outline">[{log.timestamp}]</span> {log.message.startsWith('$') || log.message.startsWith('[') ? log.message : `$ ${log.message}`}
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-md-outline mt-4"></div>
        </div>

        {/* Live URL Banner */}
        {deployments.some(d => d.status === 'live') && (() => {
          const live = deployments.find(d => d.status === 'live')
          return (
            <div className="bg-md-primary/5 border-2 border-md-primary p-6 mb-6 text-center">
              <p className="text-[10px] text-md-on-surface-variant mb-2">YOUR APP IS LIVE</p>
              <a href={live.vercel_url || live.url} target="_blank" rel="noopener noreferrer"
                className="text-xl font-bold text-md-primary hover:underline break-all">
                {live.vercel_url || live.url}
              </a>
              {live.url && live.url !== live.vercel_url && (
                <p className="text-xs text-md-outline mt-2">Canonical: {live.url}</p>
              )}
            </div>
          )
        })()}

        {/* Deployment History */}
        <div className="bg-md-surface-container rounded-md-lg p-6 shadow-sm hover:shadow-md">
          <div className="text-xs text-md-outline mb-4">Deployment History</div>

          {deployments.length === 0 ? (
            <p className="text-md-outline text-sm text-center py-4">No deployments yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-md-outline border-b border-md-outline-variant">
                    <th className="text-left py-2 pr-4">#</th>
                    <th className="text-left py-2 pr-4">STATUS</th>
                    <th className="text-left py-2 pr-4">URL</th>
                    <th className="text-left py-2 pr-4">DATE</th>
                    <th className="text-left py-2">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.map((d, i) => (
                    <tr key={d.id} className="border-b border-md-outline-variant">
                      <td className="py-2 pr-4 text-md-primary">{i + 1}</td>
                      <td className={`py-2 pr-4 font-bold ${statusColor(d.status)}`}>
                        {statusLabel(d.status)}
                      </td>
                      <td className="py-2 pr-4 text-md-on-surface-variant">
                        {d.url ? (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-md-primary underline"
                          >
                            {d.url}
                          </a>
                        ) : (
                          <span className="text-md-outline">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-md-outline">
                        {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2">
                        {d.status === 'live' && (
                          <button
                            onClick={() => handleRollback(d.id)}
                            className="px-2 py-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-md-on-primary transition-all ease-md-standard duration-300 text-[10px]"
                          >
                            Rollback
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-xs text-md-outline mt-4"></div>

          {/* CTAs */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate(`/validator/${project_id}`)}
              className="flex-1 py-4 border-2 border-md-outline-variant text-md-on-surface-variant text-sm font-bold hover:border-md-primary transition-all ease-md-standard duration-300"
            >
              Validator: Submit Feedback
            </button>
            <button
              onClick={() => navigate(`/iterate/${project_id}`)}
              className="flex-1 py-4 border-2 border-md-primary text-md-primary text-lg font-bold hover:bg-md-primary hover:text-md-on-primary transition-all ease-md-standard duration-300"
            >
              Iterate →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
