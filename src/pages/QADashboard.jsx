import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import QAStatusCard from '../components/qa/QAStatusCard'
import QATrendChart from '../components/qa/QATrendChart'
import ErrorLogTable from '../components/qa/ErrorLogTable'
import CITriggerPanel from '../components/qa/CITriggerPanel'
import QualityGatesConfig from '../components/qa/QualityGatesConfig'

const API_BASE = import.meta.env.VITE_API_URL || ''

async function apiFetch(path) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || localStorage.getItem('supabase_token') || localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

async function apiPost(path, body) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || localStorage.getItem('supabase_token') || localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export default function QADashboard() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [trends, setTrends] = useState([])
  const [errors, setErrors] = useState([])
  const [errorPage, setErrorPage] = useState(1)
  const [errorTotalPages, setErrorTotalPages] = useState(1)
  const [gates, setGates] = useState([])
  const [triggers, setTriggers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [s, t, e, g, tr] = await Promise.all([
        apiFetch(`/api/qa/${project_id}/status`),
        apiFetch(`/api/qa/${project_id}/trends?days=30`),
        apiFetch(`/api/qa/${project_id}/errors?page=${errorPage}`),
        apiFetch(`/api/qa/${project_id}/gates`),
        apiFetch(`/api/qa/${project_id}/triggers?limit=5`),
      ])
      setStatus(s)
      setTrends(t.data || t)
      setErrors(e.errors || e.data || [])
      setErrorTotalPages(e.totalPages || 1)
      setGates(g.gates || g)
      setTriggers(tr.triggers || tr.data || [])
    } catch (err) {
      console.error('QA load error:', err)
    } finally {
      setLoading(false)
    }
  }, [project_id, errorPage])

  useEffect(() => { load() }, [load])

  const handleTrigger = async (type) => {
    try {
      await apiPost(`/api/qa/${project_id}/trigger`, { type })
      setTimeout(load, 2000)
    } catch (err) {
      console.error('Trigger error:', err)
    }
  }

  const handleResolve = async (errorId) => {
    try {
      await apiPost(`/api/qa/${project_id}/errors/${errorId}/resolve`, {})
      load()
    } catch (err) {
      console.error('Resolve error:', err)
    }
  }

  const handleSaveGates = async (updatedGates) => {
    try {
      await apiPost(`/api/qa/${project_id}/gates`, { gates: updatedGates })
      load()
    } catch (err) {
      console.error('Save gates error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-md-background flex items-center justify-center">
        <div className="text-md-primary text-sm animate-pulse">Loading QA Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-md-background text-md-on-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate(`/dashboard/${project_id}`)} className="text-md-on-surface-variant text-xs hover:text-md-primary mb-1 transition-colors">← Back to Dashboard</button>
          <h1 className="text-md-on-background text-xl font-semibold tracking-tight">QA Dashboard</h1>
          <p className="text-md-on-surface-variant text-xs">Project: {project_id}</p>
        </div>
        <button onClick={load} className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 text-sm font-medium active:scale-95 transition-transform">↻ Refresh</button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <QAStatusCard title="Lint Errors" value={status?.metrics?.lint_errors ?? '—'} status={status?.metrics?.lint_errors === 0 ? 'pass' : status?.metrics?.lint_errors > 0 ? 'fail' : 'unknown'} icon="⚡" />
        <QAStatusCard title="Build Status" value={status?.metrics?.build_status === 'success' ? 'Passing' : status?.metrics?.build_status === 'failure' ? 'Failing' : '—'} status={status?.metrics?.build_status === 'success' ? 'pass' : status?.metrics?.build_status === 'failure' ? 'fail' : 'unknown'} icon="🔨" />
        <QAStatusCard title="Tests" value={status?.metrics?.test_passed != null ? `${status.metrics.test_passed}/${status.metrics.test_total}` : '—'} status={status?.metrics?.test_failed === 0 ? 'pass' : status?.metrics?.test_failed > 0 ? 'fail' : 'unknown'} icon="✓" />
        <QAStatusCard title="Coverage" value={status?.metrics?.test_coverage != null ? `${status.metrics.test_coverage}%` : '—'} status={status?.metrics?.test_coverage >= 80 ? 'pass' : status?.metrics?.test_coverage != null ? 'fail' : 'unknown'} icon="◉" />
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <QATrendChart data={trends} dataKey="lint_errors" title="Lint Errors (30d)" />
        <QATrendChart data={trends} dataKey="coverage" title="Coverage % (30d)" />
      </div>

      {/* Error Log */}
      <div className="mb-6">
        <ErrorLogTable errors={errors} page={errorPage} totalPages={errorTotalPages} onPageChange={setErrorPage} onResolve={handleResolve} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CITriggerPanel triggers={triggers} onTrigger={handleTrigger} />
        <QualityGatesConfig gates={gates} onSave={handleSaveGates} />
      </div>
    </div>
  )
}
