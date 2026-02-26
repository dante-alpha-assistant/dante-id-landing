import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { apiPost } from '../lib/api'

const SECTION_OPTIONS = [
  { key: 'navbar', label: 'Navbar', id: 'navbar' },
  { key: 'hero', label: 'Hero', id: 'hero' },
  { key: 'social_proof_bar', label: 'Social Proof', id: 'social-proof' },
  { key: 'problem', label: 'Problem', id: 'problem' },
  { key: 'solution', label: 'Solution', id: 'solution' },
  { key: 'features', label: 'Features', id: 'features' },
  { key: 'how_it_works', label: 'How It Works', id: 'how-it-works' },
  { key: 'pricing', label: 'Pricing', id: 'pricing' },
  { key: 'testimonials', label: 'Testimonials', id: 'testimonials' },
  { key: 'faq', label: 'FAQ', id: 'faq' },
  { key: 'final_cta', label: 'CTA', id: 'get-started' }
]

const TEMPLATE_OPTIONS = [
  { id: 'saas', label: 'SaaS', desc: 'Dark mode' },
  { id: 'marketplace', label: 'Marketplace', desc: 'Warm light' },
  { id: 'mobile', label: 'Mobile', desc: 'Gradient' }
]

function buildMessagesFromEdits(edits = []) {
  return edits.flatMap((edit) => {
    const summary = edit.sections_modified?.length
      ? `Updated sections: ${edit.sections_modified.join(', ')}`
      : 'Edit applied.'
    return [
      { role: 'user', content: edit.instruction },
      { role: 'assistant', content: summary }
    ]
  })
}

function stripContentForCompare(content = {}) {
  const clone = JSON.parse(JSON.stringify(content || {}))
  delete clone.edits
  delete clone.versions
  delete clone.deploy_url
  delete clone.github_url
  delete clone.last_published_content
  delete clone.last_published_at
  delete clone.last_published_url
  return clone
}

export default function Editor() {
  const { project_id } = useParams()
  const iframeRef = useRef(null)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [messages, setMessages] = useState([])
  const [showChat, setShowChat] = useState(true)
  const [activeSection, setActiveSection] = useState(null)
  const [previewKey, setPreviewKey] = useState(0)
  const [templateSwitching, setTemplateSwitching] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [versions, setVersions] = useState([])

  const previewUrl = project_id ? `/api/preview/${project_id}` : null

  const fetchLanding = useCallback(async () => {
    if (!project_id) return
    setLoading(true)
    const { data } = await supabase
      .from('deliverables')
      .select('*')
      .eq('project_id', project_id)
      .eq('type', 'landing_page')
      .single()
    if (data?.content) {
      setContent(data.content)
      setMessages(buildMessagesFromEdits(data.content.edits || []))
    }
    setLoading(false)
  }, [project_id])

  const fetchVersions = useCallback(async () => {
    if (!project_id) return
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const res = await fetch(`/api/edit-landing/versions?project_id=${project_id}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    )
    if (res.ok) {
      const data = await res.json()
      setVersions(data.versions || [])
    }
  }, [project_id])

  useEffect(() => {
    fetchLanding()
  }, [fetchLanding])

  const selectedTemplate = content?.template || 'saas'
  const publishedUrl = content?.last_published_url || content?.deploy_url
  const hasUnpublishedChanges = useMemo(() => {
    if (!content?.last_published_content) return false
    return JSON.stringify(stripContentForCompare(content)) !== JSON.stringify(content.last_published_content)
  }, [content])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = instruction.trim()
    if (!trimmed || processing) return

    setProcessing(true)
    setInstruction('')
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])

    try {
      const res = await apiPost('/api/edit-landing', {
        project_id,
        instruction: trimmed,
        section_target: activeSection?.key || null
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.error || 'Edit failed.' }])
      } else {
        const summary = data.sections_modified?.length
          ? `Updated sections: ${data.sections_modified.join(', ')}`
          : 'Edit applied.'
        setMessages((prev) => [...prev, { role: 'assistant', content: summary }])
        setContent(data.content)
        setPreviewKey((prev) => prev + 1)
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Edit failed. Please try again.' }])
    }
    setProcessing(false)
  }

  const handleTemplateSwitch = async (templateId) => {
    if (!project_id || templateSwitching) return
    setTemplateSwitching(true)
    try {
      const res = await apiPost('/api/edit-landing/switch-template', { project_id, template: templateId })
      const data = await res.json()
      if (res.ok) {
        setContent(data.content)
        setPreviewKey((prev) => prev + 1)
      }
    } finally {
      setTemplateSwitching(false)
    }
  }

  const handlePublish = async () => {
    if (!project_id || publishing) return
    setPublishing(true)
    try {
      const res = await apiPost('/api/edit-landing/publish', { project_id })
      const data = await res.json()
      if (res.ok) {
        setContent(data.content)
        setPreviewKey((prev) => prev + 1)
      }
    } finally {
      setPublishing(false)
    }
  }

  const handleRollback = async (versionIndex) => {
    if (!project_id) return
    const confirmed = window.confirm('Rollback to this version? This will overwrite your current changes and redeploy.')
    if (!confirmed) return
    const res = await apiPost('/api/edit-landing/rollback', { project_id, version_index: versionIndex })
    const data = await res.json()
    if (res.ok) {
      setContent(data.content)
      setPreviewKey((prev) => prev + 1)
      await fetchVersions()
    }
  }

  const handleSelectSection = (section) => {
    setActiveSection(section)
    setInstruction(`Edit the ${section.label}: `)
    iframeRef.current?.contentWindow?.postMessage({ type: 'scrollToSection', section: section.id }, '*')
  }

  useEffect(() => {
    if (historyOpen) {
      fetchVersions()
    }
  }, [historyOpen, fetchVersions])

  return (
    <div className="min-h-screen bg-md-background text-md-on-background">
      <div className="flex items-center justify-between px-6 py-4 border-b border-md-border/20">
        <span className="text-xl font-semibold tracking-tight">dante.</span>
        <div className="flex items-center gap-2 text-xs text-md-on-surface-variant">
          <span className="hidden sm:inline">Landing Page Editor</span>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 mb-4 md:hidden">
          <button
            onClick={() => setShowChat(true)}
            className={`px-4 py-2 rounded-full text-xs font-medium ${showChat ? 'bg-md-primary text-md-on-primary' : 'bg-md-surface-container text-md-on-surface-variant'}`}
          >
            Chat
          </button>
          <button
            onClick={() => setShowChat(false)}
            className={`px-4 py-2 rounded-full text-xs font-medium ${!showChat ? 'bg-md-primary text-md-on-primary' : 'bg-md-surface-container text-md-on-surface-variant'}`}
          >
            Preview
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Chat Panel */}
          <div className={`bg-md-surface-container rounded-md-lg p-4 shadow-sm flex flex-col ${showChat ? 'block' : 'hidden'} md:block md:w-[35%]`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-md-on-surface-variant">Editor</p>
              <button
                onClick={() => setHistoryOpen((prev) => !prev)}
                className="px-3 py-1.5 rounded-full text-xs bg-md-background text-md-on-surface-variant hover:bg-md-surface-variant/50 transition-colors"
              >
                History
              </button>
            </div>

            <div className="mb-4">
              <p className="text-xs uppercase tracking-wider text-md-on-surface-variant mb-2">Template</p>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATE_OPTIONS.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleTemplateSwitch(tpl.id)}
                    disabled={templateSwitching}
                    className={`border rounded-md-sm px-3 py-2 text-left text-xs transition-colors ${selectedTemplate === tpl.id ? 'border-md-primary bg-md-secondary-container text-md-on-secondary-container' : 'border-md-border/20 text-md-on-surface-variant hover:border-md-border/40'}`}
                  >
                    <div className="font-semibold">{tpl.label}</div>
                    <div className="text-[10px] text-md-on-surface-variant">{tpl.desc}</div>
                  </button>
                ))}
              </div>
              {templateSwitching && (
                <div className="mt-2 text-xs text-md-primary">Rebuilding template...</div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-xs uppercase tracking-wider text-md-on-surface-variant mb-2">Sections</p>
              <div className="grid grid-cols-2 gap-2">
                {SECTION_OPTIONS.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => handleSelectSection(section)}
                    className={`px-3 py-2 rounded-md-sm text-xs border ${activeSection?.key === section.key ? 'border-md-primary bg-md-secondary-container text-md-on-secondary-container' : 'border-md-border/20 text-md-on-surface-variant hover:border-md-border/40'}`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>

            {historyOpen && (
              <div className="mb-4 border border-md-border/20 rounded-md-sm p-3 max-h-48 overflow-y-auto space-y-2">
                {versions.length === 0 && (
                  <p className="text-xs text-md-on-surface-variant">No history yet.</p>
                )}
                {versions.slice().reverse().map((version, idx) => {
                  const versionIndex = versions.length - 1 - idx
                  return (
                    <div key={`${version.timestamp}-${idx}`} className="border border-md-border/20 rounded-md-sm p-2">
                      <p className="text-xs text-md-on-surface-variant">{new Date(version.timestamp).toLocaleString()}</p>
                      <p className="text-xs text-md-on-background mb-2">{version.instruction}</p>
                      <button
                        onClick={() => handleRollback(versionIndex)}
                        className="text-xs text-red-500 hover:text-red-400"
                      >
                        Rollback
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 max-h-[45vh]">
              {loading && (
                <div className="text-md-on-surface-variant text-sm">Loading...</div>
              )}
              {!loading && messages.length === 0 && (
                <div className="text-md-on-surface-variant text-sm">No edits yet. Describe what you want to change.</div>
              )}
              {!loading && messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${msg.role === 'user' ? 'bg-md-primary text-md-on-primary' : 'bg-md-background text-md-on-background'} max-w-[80%] px-3 py-2 rounded-md-sm text-sm`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Describe the change you want..."
                className="flex-1 bg-md-background border border-md-border/30 rounded-md-sm px-3 py-2 text-sm text-md-on-background placeholder:text-md-on-surface-variant focus:outline-none focus:border-md-primary"
              />
              <button
                type="submit"
                disabled={processing}
                className={`rounded-full px-6 py-2.5 text-sm font-medium active:scale-95 transition-transform ${processing ? 'bg-md-surface-variant text-md-on-surface-variant' : 'bg-md-primary text-md-on-primary'}`}
              >
                Send
              </button>
            </form>
          </div>

          {/* Preview Panel */}
          <div className={`bg-md-surface-container rounded-md-lg p-4 shadow-sm ${!showChat ? 'block' : 'hidden'} md:block md:w-[65%]`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
              <div>
                <p className="text-sm text-md-on-surface-variant">Live Preview</p>
                {hasUnpublishedChanges && (
                  <p className="text-xs text-amber-600 mt-1">Unpublished changes</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {publishedUrl && (
                  <span className="text-xs text-emerald-600">Published · <a className="underline" href={publishedUrl} target="_blank" rel="noreferrer">View live</a></span>
                )}
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className={`rounded-full px-6 py-2.5 text-sm font-medium active:scale-95 transition-transform ${publishing ? 'bg-emerald-200 text-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                >
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>
            {processing && (
              <div className="flex items-center gap-2 text-xs text-md-primary mb-2">
                <span className="w-3 h-3 border-2 border-md-primary border-t-transparent rounded-full animate-spin" />
                Updating preview...
              </div>
            )}

            <div className="relative aspect-[16/9] bg-md-background border border-md-border/20 rounded-md-sm overflow-hidden">
              {previewUrl ? (
                <iframe
                  ref={iframeRef}
                  src={`${previewUrl}?t=${previewKey}`}
                  className="absolute inset-0 w-full h-full border-0"
                  title="Landing Page Preview"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-md-on-surface-variant text-sm">
                  Preview unavailable.
                </div>
              )}
              {processing && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-sm">
                  Updating preview...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
