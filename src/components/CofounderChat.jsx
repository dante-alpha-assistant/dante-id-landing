import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function CofounderChat({ projectId, context }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Load initial messages
  useEffect(() => {
    if (!projectId || !isOpen) return
    loadMessages()
    subscribeToMessages()
  }, [projectId, isOpen])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/chat/${projectId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  const subscribeToMessages = () => {
    // Real-time subscription would go here if using Supabase realtime
    // For now we poll every 10s when chat is open
    const interval = setInterval(() => {
      if (isOpen) loadMessages()
    }, 10000)
    return () => clearInterval(interval)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setLoading(true)

    // Optimistically add user message
    setMessages(prev => [...prev, { id: 'temp', role: 'user', content: userMsg, created_at: new Date().toISOString() }])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/chat/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMsg })
      })

      if (res.ok) {
        const data = await res.json()
        // Replace temp message with actual, add AI response
        setMessages(prev => [
          ...prev.filter(m => m.id !== 'temp'),
          data.user_message,
          data.assistant_message
        ])
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(m => m.id !== 'temp'))
        alert('Failed to send message')
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== 'temp'))
      console.error('Send error:', err)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = async () => {
    if (!confirm('Clear all chat history?')) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch(`/api/chat/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      setMessages([])
    } catch (err) {
      console.error('Clear error:', err)
    }
  }

  const formatTime = (iso) => {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
      >
        <span className="text-2xl">💬</span>
        {hasNewMessages && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-[#111] border border-[#333] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🕶️</span>
          <div>
            <span className="font-medium text-white text-sm">AI Co-founder</span>
            <span className="block text-xs text-gray-500">Ask me anything</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded"
            title="Clear chat"
          >
            Clear
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Context summary */}
      {context?.deliverables?.length > 0 && (
        <div className="px-4 py-2 bg-blue-900/20 border-b border-[#333]">
          <span className="text-xs text-blue-400">
            Knows: {context.deliverables.map(d => {
              const names = { brand_identity: 'Brand', landing_page: 'Landing', business_plan: 'Plan', growth_strategy: 'Growth', personal_brand: 'Content', pitch_deck: 'Pitch', competitor_analysis: 'Competitors' }
              return names[d.type] || d.type
            }).join(', ')}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm mb-2">👋 Hi! I'm your AI co-founder.</p>
            <p className="text-xs">Ask me about strategy, review your pitch deck, or brainstorm growth ideas.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-[#222] text-gray-200 rounded-bl-md border border-[#333]'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <span className={`text-[10px] mt-1 block ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                {formatTime(msg.created_at)}
              </span>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#222] border border-[#333] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-[#333] bg-[#0a0a0a]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your business..."
            className="flex-1 bg-[#222] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-2 text-center">
          Context includes all your deliverables
        </p>
      </form>
    </div>
  )
}
