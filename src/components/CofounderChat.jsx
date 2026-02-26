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

  useEffect(() => {
    if (!projectId || !isOpen) return
    loadMessages()
    subscribeToMessages()
  }, [projectId, isOpen])

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
        setMessages(prev => [
          ...prev.filter(m => m.id !== 'temp'),
          data.user_message,
          data.assistant_message
        ])
      } else {
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-md-primary text-md-on-primary rounded-full shadow-md hover:shadow-lg flex items-center justify-center transition-shadow z-50"
      >
        <span className="text-2xl">💬</span>
        {hasNewMessages && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-md-error rounded-full border-2 border-md-background" />
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-md-surface rounded-md-lg shadow-lg flex flex-col z-50 overflow-hidden border border-md-outline-variant">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-md-outline-variant bg-md-surface-container">
        <div className="flex items-center gap-2">
          <span className="text-xl">🕶️</span>
          <div>
            <span className="font-medium text-md-on-surface text-sm">AI Co-founder</span>
            <span className="block text-xs text-md-on-surface-variant">Ask me anything</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="text-xs text-md-on-surface-variant hover:text-md-on-surface px-2 py-1 rounded-full transition-colors"
            title="Clear chat"
          >
            Clear
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-md-on-surface-variant hover:text-md-on-surface text-lg leading-none rounded-full w-8 h-8 flex items-center justify-center hover:bg-md-surface-variant transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {/* Context summary */}
      {context?.deliverables?.length > 0 && (
        <div className="px-4 py-2 bg-md-secondary-container border-b border-md-outline-variant">
          <span className="text-xs text-md-on-secondary-container">
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
          <div className="text-center text-md-on-surface-variant py-8">
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
                  ? 'bg-md-primary text-md-on-primary rounded-br-md'
                  : 'bg-md-surface-container text-md-on-surface rounded-bl-md'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <span className={`text-[10px] mt-1 block opacity-70`}>
                {formatTime(msg.created_at)}
              </span>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-md-surface-container text-md-on-surface rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-md-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-md-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-md-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-md-on-surface-variant">Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-md-outline-variant bg-md-surface-container">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your business..."
            className="flex-1 rounded-t-lg rounded-b-none border-b-2 border-md-outline bg-md-surface-variant h-11 px-4 text-sm text-md-on-surface placeholder-md-on-surface-variant focus:outline-none focus:border-md-primary transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-md-primary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-md-on-primary px-4 rounded-full text-sm font-medium transition-all"
          >
            Send
          </button>
        </div>
        <p className="text-[10px] text-md-on-surface-variant mt-2 text-center">
          Context includes all your deliverables
        </p>
      </form>
    </div>
  )
}
