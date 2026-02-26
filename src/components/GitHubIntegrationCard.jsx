import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GitHubIntegrationCard({ projectId }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const fetchStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/api/auth/github/status', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      const data = await res.json()
      setStatus(data)
    } catch (e) {
      console.error('Failed to fetch GitHub status:', e)
      setStatus({ connected: false, error: 'Failed to load status' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/api/auth/github/connect', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No OAuth URL returned')
      }
    } catch (e) {
      console.error('Failed to initiate GitHub connection:', e)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      await fetch('/api/auth/github/disconnect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      await fetchStatus()
    } catch (e) {
      console.error('Failed to disconnect GitHub:', e)
    } finally {
      setDisconnecting(false)
    }
  }

  const glowStyle = { textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }

  if (loading) {
    return (
      <div className="border border-[#1f521f] bg-[#0f0f0f] p-6 mb-8">
        <div className="text-xs text-[#1a6b1a] mb-4">+--- GITHUB INTEGRATION ---+</div>
        <div className="text-[#33ff00] font-mono terminal-blink">[LOADING...]</div>
      </div>
    )
  }

  return (
    <div className="border border-[#1f521f] bg-[#0f0f0f] p-6 mb-8">
      <div className="text-xs text-[#1a6b1a] mb-4">+--- GITHUB INTEGRATION ---+</div>

      {!status?.connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[#ffb000]">⚠</span>
            <span className="text-[#ffb000] text-sm">NOT CONNECTED</span>
          </div>
          <p className="text-[#22aa00] text-sm">
            Connect your GitHub account to enable AI code review and QA automation.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full py-2 border-2 border-[#33ff00] text-[#33ff00] text-sm font-bold hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors disabled:opacity-50"
            style={glowStyle}
          >
            {connecting ? '[ CONNECTING... ]' : '[ CONNECT GITHUB ]'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[#33ff00]">✓</span>
            <span className="text-[#33ff00] text-sm">CONNECTED</span>
          </div>
          <div className="flex items-center gap-4">
            {status.avatar_url && (
              <img
                src={status.avatar_url}
                alt="GitHub avatar"
                className="w-10 h-10 rounded border border-[#1f521f]"
              />
            )}
            <div>
              <div className="text-[#33ff00] font-bold" style={glowStyle}>
                @{status.username || status.login}
              </div>
              <div className="text-xs text-[#1a6b1a]">GitHub Account</div>
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href="/github/repos"
              className="flex-1 py-2 border border-[#33ff00] text-[#33ff00] text-sm text-center hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors"
            >
              [ SELECT REPOS → ]
            </a>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-4 py-2 border border-[#1f521f] text-[#22aa00] text-sm hover:border-[#ffb000] hover:text-[#ffb000] transition-colors disabled:opacity-50"
            >
              {disconnecting ? '[...]' : '[DISCONNECT]'}
            </button>
          </div>
        </div>
      )}

      <div className="text-xs text-[#1a6b1a] mt-4">+{'─'.repeat(26)}+</div>
    </div>
  )
}
