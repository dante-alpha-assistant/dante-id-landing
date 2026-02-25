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
  critical: { text: '[CRITICAL]', cls: 'text-[#ff3333]' },
  high: { text: '[HIGH]', cls: 'text-[#ffb000]' },
  medium: { text: '[MEDIUM]', cls: 'text-[#33ff00]' },
  low: { text: '[LOW]', cls: 'text-[#22aa00]' },
  'nice-to-have': { text: '[NICE]', cls: 'text-[#1a6b1a]' }
}

const STATUS_LABELS = {
  draft: { text: '[DRAFT]', cls: 'text-[#1a6b1a]' },
  ready: { text: '[READY]', cls: 'text-[#33ff00]' },
  'in-progress': { text: '[IN-PROGRESS]', cls: 'text-[#ffb000]' },
  done: { text: '[DONE]', cls: 'text-[#33ff00]' }
}

function PrdSection({ label, value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  useEffect(() => { setDraft(value || '') }, [value])

  if (editing) {
    return (
      <div className="mb-4">
        <label className="text-xs text-[#1a6b1a] uppercase tracking-wide mb-1 block" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.3)' }}>{label}</label>
        <textarea
          className="w-full bg-[#0d0d0d] border border-[#1f521f] p-3 text-sm text-[#33ff00] focus:outline-none focus:border-[#33ff00] resize-y min-h-[80px] font-mono"
          style={{ caretColor: '#33ff00' }}
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
      <label className="text-xs text-[#1a6b1a] uppercase tracking-wide mb-1 block" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.3)' }}>{label}</label>
      <p className="text-sm text-[#22aa00] leading-relaxed whitespace-pre-wrap group-hover:bg-[#0d0d0d] p-2 -m-2 transition-colors border border-transparent group-hover:border-[#1f521f]">
        {value || <span className="text-[#1a6b1a] italic">Click to edit...</span>}
      </p>
    </div>
  )
}

function FeatureCard({ feature, expanded, onToggle }) {
  const priority = PRIORITY_LABELS[feature.priority] || PRIORITY_LABELS.medium
  const status = STATUS_LABELS[feature.status] || STATUS_LABELS.draft

  return (
    <div
      className="bg-[#0f0f0f] border border-[#1f521f] p-4 cursor-pointer hover:border-[#33ff00] transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-[#33ff00] flex-1">{feature.name}</h4>
        <span className={`text-[10px] font-bold ${priority.cls}`}>
          {priority.text}
        </span>
      </div>
      <p className="text-xs text-[#22aa00] leading-relaxed">
        {expanded ? feature.description : (feature.description?.slice(0, 100) + (feature.description?.length > 100 ? '…' : ''))}
      </p>
      <div className="flex items-center gap-2 mt-3">
        <span className={`text-[10px] font-bold ${status.cls}`}>
          {status.text}
        </span>
      </div>
      {expanded && feature.acceptance_criteria?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#1f521f]">
          <p className="text-[10px] text-[#1a6b1a] uppercase mb-1">ACCEPTANCE CRITERIA</p>
          <ul className="space-y-1">
            {feature.acceptance_criteria.map((ac, i) => (
              <li key={i} className="text-xs text-[#22aa00] flex gap-1">
                <span className="text-[#33ff00]">{'>'}</span> {ac}
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#33ff00] font-mono terminal-blink">[LOADING...]</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f521f]">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>dante_</span>
          <span className="text-[#1a6b1a]">/</span>
          <span className="text-sm text-[#22aa00] uppercase">Refinery</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-[#22aa00] hover:bg-[#33ff00] hover:text-[#0a0a0a] border border-[#1f521f] px-3 py-1 transition-colors uppercase"
        >
          [ DASHBOARD ]
        </button>
      </div>

      {/* AI Loading overlay */}
      {aiLoading && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-[#0f0f0f] border border-[#1f521f] p-8 flex flex-col items-center gap-3">
            <div className="text-[#33ff00] terminal-blink text-lg">[PROCESSING...]</div>
            <p className="text-sm text-[#22aa00]">AI is thinking...</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Left Panel - PRD (60%) */}
        <div className="w-[60%] border-r border-[#1f521f] overflow-y-auto p-6">
          {!prd ? (
            <div className="max-w-xl mx-auto mt-16">
              <h2 className="text-xl font-semibold mb-2 uppercase" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>DESCRIBE YOUR PRODUCT IDEA</h2>
              <p className="text-sm text-[#1a6b1a] mb-6">
                The AI will generate a comprehensive Product Requirements Document.
              </p>
              <textarea
                className="w-full h-40 bg-[#0d0d0d] border border-[#1f521f] p-4 text-sm text-[#33ff00] placeholder-[#1a6b1a] focus:outline-none focus:border-[#33ff00] resize-none font-mono"
                style={{ caretColor: '#33ff00' }}
                placeholder="e.g., A marketplace for freelance designers to sell UI component packs..."
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
              />
              <button
                onClick={generatePrd}
                disabled={!ideaText.trim() || aiLoading}
                className="mt-4 w-full py-3 border border-[#33ff00] text-[#33ff00] bg-transparent hover:bg-[#33ff00] hover:text-[#0a0a0a] disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors uppercase"
              >
                [ GENERATE PRD ]
              </button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {/* AI action buttons */}
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => setShowRefineInput(!showRefineInput)}
                  className="px-3 py-1.5 bg-transparent border border-[#1f521f] text-xs text-[#22aa00] hover:border-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors uppercase"
                >
                  [ REFINE ]
                </button>
                <button
                  onClick={() => refinePrd("Expand all sections with more detail and specificity")}
                  className="px-3 py-1.5 bg-transparent border border-[#1f521f] text-xs text-[#22aa00] hover:border-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors uppercase"
                >
                  [ EXPAND ]
                </button>
                <button
                  onClick={() => refinePrd("Play devil's advocate. Challenge assumptions, identify gaps, ask hard questions, and suggest improvements")}
                  className="px-3 py-1.5 bg-transparent border border-[#1f521f] text-xs text-[#22aa00] hover:border-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors uppercase"
                >
                  [ CHALLENGE ]
                </button>
                <span className="ml-auto text-[10px] text-[#1a6b1a]">v{prd.version}</span>
              </div>

              {/* Refine input */}
              {showRefineInput && (
                <div className="mb-6 flex gap-2">
                  <input
                    className="flex-1 bg-[#0d0d0d] border border-[#1f521f] px-3 py-2 text-sm text-[#33ff00] placeholder-[#1a6b1a] focus:outline-none focus:border-[#33ff00] font-mono"
                    style={{ caretColor: '#33ff00' }}
                    placeholder="How should I improve this?"
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && refineInput.trim()) { refinePrd(refineInput); setRefineInput('') } }}
                    autoFocus
                  />
                  <button
                    onClick={() => { if (refineInput.trim()) { refinePrd(refineInput); setRefineInput('') } }}
                    className="px-4 py-2 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] text-sm transition-colors uppercase"
                  >
                    [ GO ]
                  </button>
                </div>
              )}

              {/* PRD sections */}
              <h1 className="text-2xl font-bold mb-6 uppercase" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>{content.title || 'UNTITLED PRD'}</h1>

              <PrdSection label="OVERVIEW" value={content.overview} onSave={(v) => savePrdField('overview', v)} />
              <PrdSection label="PROBLEM" value={content.problem} onSave={(v) => savePrdField('problem', v)} />
              <PrdSection label="SOLUTION" value={content.solution} onSave={(v) => savePrdField('solution', v)} />

              {content.target_users?.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-[#1a6b1a] uppercase tracking-wide mb-2 block" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.3)' }}>TARGET USERS</label>
                  <div className="space-y-2">
                    {content.target_users.map((u, i) => (
                      <div key={i} className="bg-[#0f0f0f] border border-[#1f521f] p-3">
                        <p className="text-sm font-medium text-[#33ff00]">{u.persona}</p>
                        <ul className="mt-1 space-y-0.5">
                          {u.needs?.map((n, j) => (
                            <li key={j} className="text-xs text-[#22aa00]">{'>'} {n}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.tech_stack && (
                <div className="mb-4">
                  <label className="text-xs text-[#1a6b1a] uppercase tracking-wide mb-2 block" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.3)' }}>TECH STACK</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(content.tech_stack).map(([k, v]) => (
                      <div key={k} className="bg-[#0f0f0f] border border-[#1f521f] p-2">
                        <span className="text-[10px] text-[#1a6b1a] uppercase">{k}</span>
                        <p className="text-xs text-[#22aa00]">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.success_metrics?.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-[#1a6b1a] uppercase tracking-wide mb-2 block" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.3)' }}>SUCCESS METRICS</label>
                  <div className="space-y-1">
                    {content.success_metrics.map((m, i) => (
                      <div key={i} className="flex justify-between text-xs bg-[#0f0f0f] border border-[#1f521f] p-2">
                        <span className="text-[#22aa00]">{m.metric}</span>
                        <span className="text-[#33ff00]">{m.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.risks?.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-[#1a6b1a] uppercase tracking-wide mb-2 block" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.3)' }}>RISKS</label>
                  <div className="space-y-1">
                    {content.risks.map((r, i) => (
                      <div key={i} className="bg-[#0f0f0f] border border-[#1f521f] p-2">
                        <p className="text-xs text-[#ff3333]">[WARN] {r.risk}</p>
                        <p className="text-xs text-[#22aa00] mt-1">{'>'} mitigation: {r.mitigation}</p>
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
            <h3 className="text-lg font-semibold uppercase" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>FEATURES</h3>
            {prd && features.length === 0 && (
              <button
                onClick={extractFeatures}
                disabled={aiLoading}
                className="px-3 py-1.5 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] disabled:opacity-40 text-xs font-medium transition-colors uppercase"
              >
                [ EXTRACT FEATURES ]
              </button>
            )}
          </div>

          {features.length === 0 ? (
            <p className="text-sm text-[#1a6b1a] text-center mt-8">
              {prd ? 'Click [ EXTRACT FEATURES ] to pull features from the PRD' : 'Generate a PRD first to extract features'}
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
        </div>
      </div>
    </div>
  )
}
