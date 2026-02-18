import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { apiPost } from '../lib/api'

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

export default function Editor() {
  const { project_id } = useParams()
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [messages, setMessages] = useState([])
  const [showChat, setShowChat] = useState(true)

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

  useEffect(() => {
    fetchLanding()
  }, [fetchLanding])

  const deployUrl = content?.deploy_url
  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = instruction.trim()
    if (!trimmed || processing) return

    setProcessing(true)
    setInstruction('')
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])

    try {
      const res = await apiPost('/api/edit-landing', { project_id, instruction: trimmed })
      const data = await res.json()
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.error || 'Edit failed.' }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.changes_summary || 'Edit applied.' }])
        await fetchLanding()
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Edit failed. Please try again.' }])
    }
    setProcessing(false)
  }

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
            <div className="flex-1 overflow-y-auto space-y-4 max-h-[65vh]">
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
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">Live Preview</p>
              {processing && (
                <div className="flex items-center gap-2 text-xs text-blue-400">
                  <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Rebuilding...
                </div>
              )}
            </div>

            <div className="relative aspect-[16/9] bg-[#0a0a0a] border border-[#222] rounded-lg overflow-hidden">
              {deployUrl ? (
                <iframe
                  src={deployUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  title="Landing Page Preview"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                  No deployed preview yet.
                </div>
              )}
              {processing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm">
                  Rebuilding...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
