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
    if (!stats.qualityGate) return
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
        setLogs(prev => [...prev, { timestamp: new Date().toTimeString().split(' ')[0], message: `[ERROR] ${res.error}` }])
      } else {
        setLogs(prev => [
          ...prev,
          { timestamp: new Date().toTimeString().split(' ')[0], message: `$ Deployment complete` },
          { timestamp: new Date().toTimeString().split(' ')[0], message: `$ Live at: ${res.url}` },
          { timestamp: new Date().toTimeString().split(' ')[0], message: '[DONE]' },
        ])
        await fetchDeployments()
      }
    } catch (err) {
      setError(err.message)
      setLogs(prev => [...prev, { timestamp: new Date().toTimeString().split(' ')[0], message: `[FATAL] ${err.message}` }])
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#33ff00] font-mono terminal-blink">[LOADING...]</div>
      </div>
    )
  }

  const statusColor = (status) => {
    switch (status) {
      case 'live': return 'text-[#33ff00]'
      case 'deploying': return 'text-[#ffb000] terminal-blink'
      case 'failed': return 'text-[#ff3333]'
      case 'rolled_back': return 'text-[#888]'
      default: return 'text-[#22aa00]'
    }
  }

  const statusLabel = (status) => {
    switch (status) {
      case 'live': return '[LIVE]'
      case 'deploying': return '[DEPLOYING...]'
      case 'failed': return '[FAILED]'
      case 'rolled_back': return '[ROLLED_BACK]'
      case 'pending': return '[PENDING]'
      case 'done': return '[OLD]'
      default: return `[${(status || 'UNKNOWN').toUpperCase()}]`
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f521f]">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>dante_</span>
          <span className="text-[#1a6b1a]">/</span>
          <span className="text-sm text-[#22aa00] uppercase">Deployer</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-[#22aa00] hover:bg-[#33ff00] hover:text-[#0a0a0a] border border-[#1f521f] px-3 py-1 transition-colors uppercase"
        >
          [ DASHBOARD ]
        </button>
      </div>

      <div className="max-w-4xl mx-auto mt-8 px-4 pb-16 space-y-8">
        {/* Project Status */}
        <div className="bg-[#0f0f0f] border border-[#1f521f] p-6">
          <div className="text-xs text-[#1a6b1a] mb-4">+--- PROJECT STATUS ---+</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#22aa00]">  Features:</span>
              <span className="text-[#33ff00]">{stats.features}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#22aa00]">  Builds:</span>
              <span className="text-[#33ff00]">{stats.builds}/{stats.totalBuilds} {stats.builds >= stats.totalBuilds && stats.totalBuilds > 0 ? '[OK]' : '[PARTIAL]'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#22aa00]">  Tests:</span>
              <span className="text-[#33ff00]">{stats.testsPassed}/{stats.testsTotal} passed</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#22aa00]">  Quality Gate:</span>
              <span className={stats.qualityGate ? 'text-[#33ff00]' : 'text-[#ff3333]'}>
                {stats.qualityGate ? '[PASS]' : '[BLOCK]'}
              </span>
            </div>
          </div>
          <div className="text-xs text-[#1a6b1a] mt-4">+----------------------+</div>
        </div>

        {/* Deploy Console */}
        <div className="bg-[#0f0f0f] border border-[#1f521f] p-6">
          <div className="text-xs text-[#1a6b1a] mb-4">+--- DEPLOY CONSOLE ---+</div>

          {/* Target selector */}
          <div className="flex gap-2 mb-6">
            {TARGETS.map(t => (
              <button
                key={t.key}
                onClick={() => setTarget(t.key)}
                className={`px-4 py-2 text-sm border transition-colors ${
                  target === t.key
                    ? 'bg-[#33ff00] text-[#0a0a0a] border-[#33ff00]'
                    : 'text-[#22aa00] border-[#1f521f] hover:border-[#33ff00]'
                }`}
              >
                [ {t.label} ]
              </button>
            ))}
          </div>

          {/* Deploy button */}
          <button
            onClick={handleDeploy}
            disabled={deploying || !stats.qualityGate}
            className={`w-full py-4 text-lg border transition-colors mb-6 ${
              !stats.qualityGate
                ? 'border-[#333] text-[#555] cursor-not-allowed'
                : deploying
                  ? 'border-[#ffb000] text-[#ffb000] terminal-blink cursor-wait'
                  : 'border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a]'
            }`}
          >
            {deploying ? '[ DEPLOYING... ]' : !stats.qualityGate ? '[ DEPLOY BLOCKED ]' : '[ DEPLOY > ]'}
          </button>

          {error && (
            <div className="mb-4 p-3 border border-[#ff3333] text-[#ff3333] text-sm">
              [ERROR] {error}
            </div>
          )}

          {/* Log output */}
          {logs.length > 0 && (
            <div className="bg-[#0a0a0a] border border-[#1f521f] p-4 max-h-64 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className={`text-xs ${log.message.includes('[ERROR]') || log.message.includes('[FATAL]') ? 'text-[#ff3333]' : log.message.includes('[DONE]') ? 'text-[#33ff00] font-bold' : 'text-[#22aa00]'}`}>
                  <span className="text-[#1a6b1a]">[{log.timestamp}]</span> {log.message.startsWith('$') || log.message.startsWith('[') ? log.message : `$ ${log.message}`}
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-[#1a6b1a] mt-4">+----------------------+</div>
        </div>

        {/* Live URL Banner */}
        {deployments.some(d => d.status === 'live') && (() => {
          const live = deployments.find(d => d.status === 'live')
          return (
            <div className="bg-[#33ff00]/5 border-2 border-[#33ff00] p-6 mb-6 text-center">
              <p className="text-[10px] text-[#22aa00] mb-2">YOUR APP IS LIVE</p>
              <a href={live.vercel_url || live.url} target="_blank" rel="noopener noreferrer"
                className="text-xl font-bold text-[#33ff00] hover:underline break-all">
                {live.vercel_url || live.url}
              </a>
              {live.url && live.url !== live.vercel_url && (
                <p className="text-xs text-[#1a6b1a] mt-2">Canonical: {live.url}</p>
              )}
            </div>
          )
        })()}

        {/* Deployment History */}
        <div className="bg-[#0f0f0f] border border-[#1f521f] p-6">
          <div className="text-xs text-[#1a6b1a] mb-4">+--- DEPLOYMENT HISTORY ---+</div>

          {deployments.length === 0 ? (
            <p className="text-[#1a6b1a] text-sm text-center py-4">No deployments yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#1a6b1a] border-b border-[#1f521f]">
                    <th className="text-left py-2 pr-4">#</th>
                    <th className="text-left py-2 pr-4">STATUS</th>
                    <th className="text-left py-2 pr-4">URL</th>
                    <th className="text-left py-2 pr-4">DATE</th>
                    <th className="text-left py-2">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.map((d, i) => (
                    <tr key={d.id} className="border-b border-[#0a0a0a]">
                      <td className="py-2 pr-4 text-[#33ff00]">{i + 1}</td>
                      <td className={`py-2 pr-4 font-bold ${statusColor(d.status)}`}>
                        {statusLabel(d.status)}
                      </td>
                      <td className="py-2 pr-4 text-[#22aa00]">
                        {d.url ? (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#33ff00] underline"
                          >
                            {d.url}
                          </a>
                        ) : (
                          <span className="text-[#1a6b1a]">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-[#1a6b1a]">
                        {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2">
                        {d.status === 'live' && (
                          <button
                            onClick={() => handleRollback(d.id)}
                            className="px-2 py-1 border border-[#ff3333] text-[#ff3333] hover:bg-[#ff3333] hover:text-[#0a0a0a] transition-colors text-[10px]"
                          >
                            [ ROLLBACK ]
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-xs text-[#1a6b1a] mt-4">+--------------------------+</div>

          {/* CTAs */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate(`/validator/${project_id}`)}
              className="flex-1 py-4 border-2 border-[#1f521f] text-[#22aa00] text-sm font-bold hover:border-[#33ff00] transition-colors"
            >
              [ VALIDATOR: Submit Feedback ]
            </button>
            <button
              onClick={() => navigate(`/iterate/${project_id}`)}
              className="flex-1 py-4 border-2 border-[#33ff00] text-[#33ff00] text-lg font-bold hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors"
            >
              [ ITERATE → ]
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
