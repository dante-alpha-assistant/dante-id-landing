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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
        <span className="text-xl font-bold tracking-tight">dante.</span>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="hidden sm:inline">Landing Page Editor</span>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 mb-4 md:hidden">
          <button
            onClick={() => setShowChat(true)}
            className={`px-3 py-1.5 rounded-full text-xs ${showChat ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}
          >
            Chat
          </button>
          <button
            onClick={() => setShowChat(false)}
            className={`px-3 py-1.5 rounded-full text-xs ${!showChat ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}
          >
            Preview
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Chat Panel */}
          <div className={`bg-[#111] border border-[#222] rounded-xl p-4 flex flex-col ${showChat ? 'block' : 'hidden'} md:block md:w-[35%]`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">Editor</p>
              <button
                onClick={() => setHistoryOpen((prev) => !prev)}
                className="px-3 py-1.5 rounded-full text-xs bg-white/5 text-gray-300 hover:bg-white/10"
              >
                History
              </button>
            </div>

            <div className="mb-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Template</p>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATE_OPTIONS.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleTemplateSwitch(tpl.id)}
                    disabled={templateSwitching}
                    className={`border rounded-lg px-3 py-2 text-left text-xs transition-colors ${selectedTemplate === tpl.id ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-gray-300 hover:border-white/20'}`}
                  >
                    <div className="font-semibold">{tpl.label}</div>
                    <div className="text-[10px] text-gray-500">{tpl.desc}</div>
                  </button>
                ))}
              </div>
              {templateSwitching && (
                <div className="mt-2 text-xs text-blue-400">Rebuilding template...</div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Sections</p>
              <div className="grid grid-cols-2 gap-2">
                {SECTION_OPTIONS.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => handleSelectSection(section)}
                    className={`px-3 py-2 rounded-lg text-xs border ${activeSection?.key === section.key ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-gray-300 hover:border-white/20'}`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>

            {historyOpen && (
              <div className="mb-4 border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {versions.length === 0 && (
                  <p className="text-xs text-gray-500">No history yet.</p>
                )}
                {versions.slice().reverse().map((version, idx) => {
                  const versionIndex = versions.length - 1 - idx
                  return (
                    <div key={`${version.timestamp}-${idx}`} className="border border-white/10 rounded-lg p-2">
                      <p className="text-xs text-gray-400">{new Date(version.timestamp).toLocaleString()}</p>
                      <p className="text-xs text-gray-200 mb-2">{version.instruction}</p>
                      <button
                        onClick={() => handleRollback(versionIndex)}
                        className="text-xs text-red-300 hover:text-red-200"
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
                <div className="text-gray-500 text-sm">Loading...</div>
              )}
              {!loading && messages.length === 0 && (
                <div className="text-gray-500 text-sm">No edits yet. Describe what you want to change.</div>
              )}
              {!loading && messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-200'} max-w-[80%] px-3 py-2 rounded-lg text-sm`}>
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
                className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={processing}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${processing ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                Send
              </button>
            </form>
          </div>

          {/* Preview Panel */}
          <div className={`bg-[#111] border border-[#222] rounded-xl p-4 ${!showChat ? 'block' : 'hidden'} md:block md:w-[65%]`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
              <div>
                <p className="text-sm text-gray-400">Live Preview</p>
                {hasUnpublishedChanges && (
                  <p className="text-xs text-yellow-400 mt-1">Unpublished changes</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {publishedUrl && (
                  <span className="text-xs text-green-400">Published · <a className="underline" href={publishedUrl} target="_blank" rel="noreferrer">View live</a></span>
                )}
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${publishing ? 'bg-green-900/60 text-green-200' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                >
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>
            {processing && (
              <div className="flex items-center gap-2 text-xs text-blue-400 mb-2">
                <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Updating preview...
              </div>
            )}

            <div className="relative aspect-[16/9] bg-[#0a0a0a] border border-[#222] rounded-lg overflow-hidden">
              {previewUrl ? (
                <iframe
                  ref={iframeRef}
                  src={`${previewUrl}?t=${previewKey}`}
                  className="absolute inset-0 w-full h-full border-0"
                  title="Landing Page Preview"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                  Preview unavailable.
                </div>
              )}
              {processing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm">
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
