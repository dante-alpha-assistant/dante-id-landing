import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const API_BASE = '/api/refinery'

async function apiCall(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  })
  return res.json()
}

const PRIORITY_LABELS = {
  critical: { text: 'Critical', cls: 'text-red-500' },
  high: { text: 'High', cls: 'text-amber-500' },
  medium: { text: 'Medium', cls: 'text-md-primary' },
  low: { text: 'Low', cls: 'text-md-on-surface-variant' },
  'nice-to-have': { text: 'Nice', cls: 'text-md-outline' }
}

const STATUS_LABELS = {
  draft: { text: 'Draft', cls: 'text-md-outline' },
  ready: { text: 'Ready', cls: 'text-md-primary' },
  'in-progress': { text: 'In Progress', cls: 'text-amber-500' },
  done: { text: 'Done', cls: 'text-md-primary' }
}

function PrdSection({ label, value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  useEffect(() => { setDraft(value || '') }, [value])

  if (editing) {
    return (
      <div className="mb-4">
        <label className="text-xs text-md-outline uppercase tracking-wide mb-1 block">{label}</label>
        <textarea
          className="w-full bg-md-surface-variant border border-md-outline-variant rounded-md-lg p-3 text-sm text-md-primary focus:outline-none focus:border-md-primary resize-y min-h-[80px]"
          
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { setEditing(false); if (draft !== value) onSave(draft) }}
          autoFocus
        />
      </div>
    )
  }

  return (
    <div className="mb-4 cursor-pointer group" onClick={() => setEditing(true)}>
      <label className="text-xs text-md-outline uppercase tracking-wide mb-1 block">{label}</label>
      <p className="text-sm text-md-on-surface-variant leading-relaxed whitespace-pre-wrap group-hover:bg-md-surface-variant p-2 -m-2 transition-all ease-md-standard duration-300 border border-transparent group-hover:border-md-outline-variant">
        {value || <span className="text-md-outline italic">Click to edit...</span>}
      </p>
    </div>
  )
}

function FeatureCard({ feature, expanded, onToggle }) {
  const priority = PRIORITY_LABELS[feature.priority] || PRIORITY_LABELS.medium
  const status = STATUS_LABELS[feature.status] || STATUS_LABELS.draft

  return (
    <div
      className="bg-md-surface-container rounded-md-lg p-4 shadow-sm cursor-pointer hover:border-md-primary transition-all ease-md-standard duration-300"
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-md-primary flex-1">{feature.name}</h4>
        <span className={`text-[10px] font-bold ${priority.cls}`}>
          {priority.text}
        </span>
      </div>
      <p className="text-xs text-md-on-surface-variant leading-relaxed">
        {expanded ? feature.description : (feature.description?.slice(0, 100) + (feature.description?.length > 100 ? '…' : ''))}
      </p>
      <div className="flex items-center gap-2 mt-3">
        <span className={`text-[10px] font-bold ${status.cls}`}>
          {status.text}
        </span>
      </div>
      {expanded && feature.acceptance_criteria?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-md-outline-variant">
          <p className="text-[10px] text-md-outline uppercase mb-1">ACCEPTANCE CRITERIA</p>
          <ul className="space-y-1">
            {feature.acceptance_criteria.map((ac, i) => (
              <li key={i} className="text-xs text-md-on-surface-variant flex gap-1">
                <span className="text-md-primary">•</span> {ac}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function Refinery() {
  const { project_id } = useParams()
  const navigate = useNavigate()
  const [prd, setPrd] = useState(null)
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [ideaText, setIdeaText] = useState('')
  const [refineInput, setRefineInput] = useState('')
  const [showRefineInput, setShowRefineInput] = useState(false)
  const [expandedFeatures, setExpandedFeatures] = useState({})

  const fetchData = useCallback(async () => {
    const [prdRes, featRes] = await Promise.all([
      apiCall(`/${project_id}/prd`),
      apiCall(`/${project_id}/features`)
    ])
    setPrd(prdRes.prd)
    setFeatures(featRes.features || [])
    setLoading(false)
  }, [project_id])

  useEffect(() => { fetchData() }, [fetchData])

  // Pre-fill idea from project
  useEffect(() => {
    async function loadProjectIdea() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: project } = await supabase
        .from('projects')
        .select('idea')
        .eq('id', project_id)
        .single()
      if (project?.idea && !ideaText) setIdeaText(project.idea)
    }
    loadProjectIdea()
  }, [project_id])

  const generatePrd = async () => {
    if (!ideaText.trim()) return
    setAiLoading(true)
    try {
      const res = await apiCall('/generate-prd', {
        method: 'POST',
        body: JSON.stringify({ project_id, idea_description: ideaText })
      })
      if (res.prd) setPrd(res.prd)
    } catch (err) {
      console.error('Generate PRD failed:', err)
    }
    setAiLoading(false)
  }

  const refinePrd = async (instruction) => {
    if (!prd) return
    setAiLoading(true)
    setShowRefineInput(false)
    try {
      const res = await apiCall('/refine', {
        method: 'POST',
        body: JSON.stringify({ project_id, prd_id: prd.id, instruction })
      })
      if (res.prd) setPrd(res.prd)
    } catch (err) {
      console.error('Refine failed:', err)
    }
    setAiLoading(false)
  }

  const extractFeatures = async () => {
    if (!prd) return
    setAiLoading(true)
    try {
      const res = await apiCall('/extract-features', {
        method: 'POST',
        body: JSON.stringify({ project_id, prd_id: prd.id })
      })
      if (res.features) setFeatures(res.features)
    } catch (err) {
      console.error('Extract features failed:', err)
    }
    setAiLoading(false)
  }

  const savePrdField = async (field, value) => {
    if (!prd) return
    const updated = { ...prd.content, [field]: value }
    const res = await apiCall(`/${project_id}/prd`, {
      method: 'PUT',
      body: JSON.stringify({ content: updated })
    })
    if (res.prd) setPrd(res.prd)
  }

  const content = prd?.content || {}

  if (loading) {
    return (
      <div className="min-h-screen bg-md-background flex items-center justify-center">
        <div className="text-md-primary animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-md-background text-md-on-surface">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-md-outline-variant">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight">dante_</span>
          <span className="text-md-outline">/</span>
          <span className="text-sm text-md-on-surface-variant uppercase">Refinery</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-md-on-surface-variant hover:bg-md-primary hover:text-md-on-primary border border-md-outline-variant px-3 py-1 transition-all ease-md-standard duration-300 uppercase"
        >
          Dashboard
        </button>
      </div>

      {/* AI Loading overlay */}
      {aiLoading && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-md-surface-container rounded-md-lg p-8 shadow-sm flex flex-col items-center gap-3">
            <div className="text-md-primary animate-pulse text-lg">Processing...</div>
            <p className="text-sm text-md-on-surface-variant">AI is thinking...</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Left Panel - PRD (60%) */}
        <div className="w-[60%] border-r border-md-outline-variant overflow-y-auto p-6">
          {!prd ? (
            <div className="max-w-xl mx-auto mt-16">
              <h2 className="text-xl font-semibold mb-2 uppercase">DESCRIBE YOUR PRODUCT IDEA</h2>
              <p className="text-sm text-md-outline mb-6">
                The AI will generate a comprehensive Product Requirements Document.
              </p>
              <textarea
                className="w-full h-40 bg-md-surface-variant border border-md-outline-variant rounded-md-lg p-4 text-sm text-md-primary placeholder-md-outline focus:outline-none focus:border-md-primary resize-none"
                
                placeholder="e.g., A marketplace for freelance designers to sell UI component packs..."
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
              />
              <button
                onClick={generatePrd}
                disabled={!ideaText.trim() || aiLoading}
                className="mt-4 w-full py-3 border border-md-primary text-md-primary bg-transparent hover:bg-md-primary hover:text-md-on-primary disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-all ease-md-standard duration-300 uppercase"
              >
                Generate PRD
              </button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {/* AI action buttons */}
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => setShowRefineInput(!showRefineInput)}
                  className="px-3 py-1.5 bg-transparent border border-md-outline-variant text-xs text-md-on-surface-variant hover:border-md-primary hover:bg-md-primary hover:text-md-on-primary transition-all ease-md-standard duration-300 uppercase"
                >
                  Refine
                </button>
                <button
                  onClick={() => refinePrd("Expand all sections with more detail and specificity")}
                  className="px-3 py-1.5 bg-transparent border border-md-outline-variant text-xs text-md-on-surface-variant hover:border-md-primary hover:bg-md-primary hover:text-md-on-primary transition-all ease-md-standard duration-300 uppercase"
                >
                  Expand
                </button>
                <button
                  onClick={() => refinePrd("Play devil's advocate. Challenge assumptions, identify gaps, ask hard questions, and suggest improvements")}
                  className="px-3 py-1.5 bg-transparent border border-md-outline-variant text-xs text-md-on-surface-variant hover:border-md-primary hover:bg-md-primary hover:text-md-on-primary transition-all ease-md-standard duration-300 uppercase"
                >
                  Challenge
                </button>
                <span className="ml-auto text-[10px] text-md-outline">v{prd.version}</span>
              </div>

              {/* Refine input */}
              {showRefineInput && (
                <div className="mb-6 flex gap-2">
                  <input
                    className="flex-1 bg-md-surface-variant border border-md-outline-variant px-3 py-2 text-sm text-md-primary placeholder-md-outline focus:outline-none focus:border-md-primary"
                    
                    placeholder="How should I improve this?"
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && refineInput.trim()) { refinePrd(refineInput); setRefineInput('') } }}
                    autoFocus
                  />
                  <button
                    onClick={() => { if (refineInput.trim()) { refinePrd(refineInput); setRefineInput('') } }}
                    className="px-4 py-2 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary text-sm transition-all ease-md-standard duration-300 uppercase"
                  >
                    Go
                  </button>
                </div>
              )}

              {/* PRD sections */}
              <h1 className="text-2xl font-bold mb-6 uppercase">{content.title || 'UNTITLED PRD'}</h1>

              <PrdSection label="OVERVIEW" value={content.overview} onSave={(v) => savePrdField('overview', v)} />
              <PrdSection label="PROBLEM" value={content.problem} onSave={(v) => savePrdField('problem', v)} />
              <PrdSection label="SOLUTION" value={content.solution} onSave={(v) => savePrdField('solution', v)} />

              {content.target_users?.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-md-outline uppercase tracking-wide mb-2 block">TARGET USERS</label>
                  <div className="space-y-2">
                    {content.target_users.map((u, i) => (
                      <div key={i} className="bg-md-surface-container rounded-md-lg p-3 shadow-sm">
                        <p className="text-sm font-medium text-md-primary">{u.persona}</p>
                        <ul className="mt-1 space-y-0.5">
                          {u.needs?.map((n, j) => (
                            <li key={j} className="text-xs text-md-on-surface-variant">• {n}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.tech_stack && (
                <div className="mb-4">
                  <label className="text-xs text-md-outline uppercase tracking-wide mb-2 block">TECH STACK</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(content.tech_stack).map(([k, v]) => (
                      <div key={k} className="bg-md-surface-container rounded-md-lg p-2 shadow-sm">
                        <span className="text-[10px] text-md-outline uppercase">{k}</span>
                        <p className="text-xs text-md-on-surface-variant">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.success_metrics?.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-md-outline uppercase tracking-wide mb-2 block">SUCCESS METRICS</label>
                  <div className="space-y-1">
                    {content.success_metrics.map((m, i) => (
                      <div key={i} className="flex justify-between text-xs bg-md-surface-container rounded-md-lg p-2 shadow-sm">
                        <span className="text-md-on-surface-variant">{m.metric}</span>
                        <span className="text-md-primary">{m.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.risks?.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-md-outline uppercase tracking-wide mb-2 block">RISKS</label>
                  <div className="space-y-1">
                    {content.risks.map((r, i) => (
                      <div key={i} className="bg-md-surface-container rounded-md-lg p-2 shadow-sm">
                        <p className="text-xs text-red-500">⚠ {r.risk}</p>
                        <p className="text-xs text-md-on-surface-variant mt-1">• mitigation: {r.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <PrdSection label="TIMELINE" value={content.timeline} onSave={(v) => savePrdField('timeline', v)} />
            </div>
          )}
        </div>

        {/* Right Panel - Features (40%) */}
        <div className="w-[40%] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold uppercase">FEATURES</h3>
            {prd && features.length === 0 && (
              <button
                onClick={extractFeatures}
                disabled={aiLoading}
                className="px-3 py-1.5 border border-md-primary text-md-primary hover:bg-md-primary hover:text-md-on-primary disabled:opacity-40 text-xs font-medium transition-all ease-md-standard duration-300 uppercase"
              >
                Extract Features
              </button>
            )}
          </div>

          {features.length === 0 ? (
            <p className="text-sm text-md-outline text-center mt-8">
              {prd ? 'Click Extract Features to pull features from the PRD' : 'Generate a PRD first to extract features'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {features.map((f) => (
                <FeatureCard
                  key={f.id}
                  feature={f}
                  expanded={!!expandedFeatures[f.id]}
                  onToggle={() => setExpandedFeatures(p => ({ ...p, [f.id]: !p[f.id] }))}
                />
              ))}
            </div>
          )}

          {/* CTA to next stage */}
          {features.length > 0 && (
            <button
              onClick={() => navigate(`/foundry/${project_id}`)}
              className="w-full mt-6 py-4 border-2 border-md-primary text-md-primary text-lg font-bold hover:bg-md-primary hover:text-md-on-primary transition-all ease-md-standard duration-300"
            >
              Continue to Foundry →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
