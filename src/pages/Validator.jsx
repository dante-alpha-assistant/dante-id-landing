import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const API = '/api/validator'

async function apiCall(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    ...options
  })
  return res.json()
}

const TYPE_STYLES = {
  bug: { label: 'Bug', cls: 'text-red-500 bg-red-500/10' },
  improvement: { label: 'Improve', cls: 'text-amber-500 bg-amber-500/10' },
  question: { label: 'Question', cls: 'text-blue-500 bg-blue-500/10' },
  approval: { label: 'Approved', cls: 'text-md-primary bg-md-primary/10' },
}

const STATUS_STYLES = {
  open: 'text-md-primary border-md-primary',
  in_progress: 'text-amber-500 border-amber-500',
  resolved: 'text-md-outline border-md-outline',
  wont_fix: 'text-red-500 border-red-500',
}

export default function Validator() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState([])
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'bug', title: '', description: '', feature_id: '' })
  const [lastAnalysis, setLastAnalysis] = useState(null)

  const fetchData = useCallback(async () => {
    const [fbRes, featRes] = await Promise.all([
      apiCall(`/${project_id}/feedback`),
      fetch(`/api/refinery/${project_id}/features`, {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }
      }).then(r => r.json())
    ])
    setFeedback(fbRes.feedback || [])
    setFeatures(featRes.features || [])
    setLoading(false)
  }, [project_id])

  useEffect(() => { fetchData() }, [fetchData])

  const submitFeedback = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    await apiCall('/submit-feedback', {
      method: 'POST',
      body: JSON.stringify({ project_id, ...form, feature_id: form.feature_id || null })
    })
    setForm({ type: 'bug', title: '', description: '', feature_id: '' })
    setShowForm(false)
    fetchData()
  }

  const updateStatus = async (id, status) => {
    await apiCall(`/feedback/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    fetchData()
  }

  const analyzeFeedback = async () => {
    setAiLoading(true)
    try {
      const res = await apiCall('/analyze-feedback', { method: 'POST', body: JSON.stringify({ project_id }) })
      setLastAnalysis(res)
      fetchData()
    } catch (err) { console.error(err) }
    setAiLoading(false)
  }

  const openCount = feedback.filter(f => f.status === 'open').length

  if (loading) return (
    <div className="min-h-screen bg-md-background flex items-center justify-center">
      <div className="text-md-primary animate-pulse">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-md-background text-md-on-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-md-outline-variant">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold">dante_</span>
          <span className="text-md-outline">/</span>
          <span className="text-sm text-md-on-surface-variant uppercase">Validator</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/dashboard/${project_id}`)}
            className="text-sm text-md-on-surface-variant hover:bg-md-primary hover:text-md-on-primary border border-md-outline-variant px-3 py-1 transition-all ease-md-standard duration-300 uppercase">
            Dashboard
          </button>
        </div>
      </div>

      {/* AI Loading */}
      {aiLoading && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-md-surface-container rounded-md-lg p-8 shadow-sm text-center">
            <div className="text-md-primary animate-pulse text-lg">Analyzing feedback...</div>
            <p className="text-sm text-md-on-surface-variant mt-2">AI is generating improvement tickets from {openCount} open items</p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Stats + Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4">
            <div className="border border-md-outline-variant px-3 py-1">
              <span className="text-[10px] text-md-outline block">TOTAL</span>
              <span className="text-lg font-bold">{feedback.length}</span>
            </div>
            <div className="border border-md-outline-variant px-3 py-1">
              <span className="text-[10px] text-md-outline block">OPEN</span>
              <span className="text-lg font-bold text-md-primary">{openCount}</span>
            </div>
            <div className="border border-md-outline-variant px-3 py-1">
              <span className="text-[10px] text-md-outline block">RESOLVED</span>
              <span className="text-lg font-bold text-md-outline">{feedback.filter(f => f.status === 'resolved').length}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)}
              className="px-3 py-1.5 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary text-xs transition-all ease-md-standard duration-300 uppercase">
              + New Feedback
            </button>
            {openCount > 0 && (
              <button onClick={analyzeFeedback} disabled={aiLoading}
                className="px-3 py-1.5 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary disabled:opacity-40 text-xs transition-all ease-md-standard duration-300 uppercase">
                Analyze & Generate Tickets ({openCount})
              </button>
            )}
          </div>
        </div>

        {/* New Feedback Form */}
        {showForm && (
          <form onSubmit={submitFeedback} className="border border-md-outline-variant rounded-md-lg p-4 mb-6 space-y-3">
            <div className="flex gap-3">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="bg-md-background border border-md-outline-variant text-md-primary px-2 py-1 text-xs">
                <option value="bug">Bug</option>
                <option value="improvement">Improvement</option>
                <option value="question">Question</option>
                <option value="approval">Approval</option>
              </select>
              <select value={form.feature_id} onChange={e => setForm({ ...form, feature_id: e.target.value })}
                className="bg-md-background border border-md-outline-variant text-md-primary px-2 py-1 text-xs">
                <option value="">General</option>
                {features.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title..."
              className="w-full bg-md-background border border-md-outline-variant text-md-primary px-3 py-2 text-sm placeholder-md-outline focus:border-md-primary outline-none" />
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)..."
              className="w-full bg-md-background border border-md-outline-variant text-md-primary px-3 py-2 text-sm placeholder-md-outline focus:border-md-primary outline-none h-20 resize-none" />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-1.5 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary text-xs transition-all ease-md-standard duration-300">
                Submit
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 border border-md-outline-variant text-md-outline hover:border-md-primary text-xs transition-all ease-md-standard duration-300">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Analysis Results */}
        {lastAnalysis && lastAnalysis.tickets?.length > 0 && (
          <div className="border border-md-primary bg-md-primary/5 p-4 mb-6">
            <h3 className="text-sm font-bold mb-2">AI ANALYSIS COMPLETE</h3>
            <p className="text-xs text-md-on-surface-variant mb-3">{lastAnalysis.summary}</p>
            <p className="text-xs text-md-outline">{lastAnalysis.tickets.length} work orders created from {lastAnalysis.feedback_processed} feedback items → <button onClick={() => navigate(`/planner/${project_id}`)} className="text-md-primary hover:underline">View in Planner →</button></p>
          </div>
        )}

        {/* Feedback List */}
        {feedback.length === 0 ? (
          <div className="border border-md-outline-variant rounded-md-lg p-12 text-center">
            <p className="text-md-on-surface-variant mb-4">No feedback yet.</p>
            <p className="text-xs text-md-outline">Submit feedback to capture bugs, improvements, and approvals. AI will analyze them and generate work orders.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {feedback.map(f => {
              const ts = TYPE_STYLES[f.type] || TYPE_STYLES.improvement
              const ss = STATUS_STYLES[f.status] || STATUS_STYLES.open
              return (
                <div key={f.id} className="border border-md-outline-variant rounded-md-lg p-3 hover:border-md-primary/50 transition-all ease-md-standard duration-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 ${ts.cls}`}>{ts.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 border ${ss}`}>{f.status.toUpperCase()}</span>
                        {f.features?.name && <span className="text-[10px] text-md-outline">→ {f.features.name}</span>}
                      </div>
                      <h4 className="text-sm font-medium">{f.title}</h4>
                      {f.description && <p className="text-xs text-md-on-surface-variant mt-1">{f.description}</p>}
                      {f.ai_analysis?.ticket_title && (
                        <p className="text-[10px] text-md-outline mt-1">→ Ticket: {f.ai_analysis.ticket_title}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {f.status === 'open' && (
                        <button onClick={() => updateStatus(f.id, 'resolved')}
                          className="text-[10px] border border-md-outline-variant px-1.5 py-0.5 hover:border-md-primary hover:bg-md-primary hover:text-md-on-primary transition-all ease-md-standard duration-300">
                          Resolve
                        </button>
                      )}
                      {f.status === 'open' && (
                        <button onClick={() => updateStatus(f.id, 'wont_fix')}
                          className="text-[10px] border border-md-outline-variant px-1.5 py-0.5 hover:border-red-500 hover:text-red-500 transition-all ease-md-standard duration-300">
                          Won't Fix
                        </button>
                      )}
                      {f.status !== 'open' && (
                        <button onClick={() => updateStatus(f.id, 'open')}
                          className="text-[10px] border border-md-outline-variant px-1.5 py-0.5 hover:border-md-primary transition-all ease-md-standard duration-300 text-md-outline">
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-md-outline mt-2">{new Date(f.created_at).toLocaleString()}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* CTA to Planner */}
        {feedback.some(f => f.status === 'in_progress') && (
          <button onClick={() => navigate(`/planner/${project_id}`)}
            className="w-full mt-6 py-4 border-2 border-md-primary text-md-primary text-lg font-bold hover:bg-md-primary hover:text-md-on-primary transition-all ease-md-standard duration-300">
            View Generated Tickets in Planner
          </button>
        )}
      </div>
    </div>
  )
}
