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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
        <div className="text-[#33ff00] text-sm animate-pulse">▶ Loading QA Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-mono p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate(`/dashboard/${project_id}`)} className="text-zinc-600 text-xs hover:text-[#33ff00] mb-1">← Back to Dashboard</button>
          <h1 className="text-[#33ff00] text-xl uppercase tracking-wider">QA Dashboard</h1>
          <p className="text-zinc-600 text-xs">Project: {project_id}</p>
        </div>
        <button onClick={load} className="px-3 py-1 text-xs uppercase border border-zinc-800 rounded-none text-zinc-500 hover:border-[#33ff00] hover:text-[#33ff00]">↻ Refresh</button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <QAStatusCard title="Lint Errors" value={status?.lint_errors ?? '—'} status={status?.lint_errors === 0 ? 'pass' : status?.lint_errors > 0 ? 'fail' : 'unknown'} icon="⚡" />
        <QAStatusCard title="Build Status" value={status?.build_status ?? '—'} status={status?.build_status === 'passing' ? 'pass' : status?.build_status === 'failing' ? 'fail' : 'unknown'} icon="🔨" />
        <QAStatusCard title="Tests" value={status?.tests_passed != null ? `${status.tests_passed}/${status.tests_total}` : '—'} status={status?.tests_passed === status?.tests_total ? 'pass' : 'fail'} icon="✓" />
        <QAStatusCard title="Coverage" value={status?.coverage != null ? `${status.coverage}%` : '—'} status={status?.coverage >= 80 ? 'pass' : status?.coverage != null ? 'fail' : 'unknown'} icon="◉" />
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
