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

  if (loading) {
    return (
      <div className="bg-md-surface-container rounded-md-lg p-6 mb-8 shadow-sm">
        <h3 className="text-sm font-semibold text-md-on-surface-variant mb-4">GitHub Integration</h3>
        <div className="text-md-on-surface-variant animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-md-surface-container rounded-md-lg p-6 mb-8 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-sm font-semibold text-md-on-surface-variant mb-4">GitHub Integration</h3>

      {!status?.connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-md-tertiary">⚠</span>
            <span className="text-md-tertiary text-sm font-medium">Not Connected</span>
          </div>
          <p className="text-md-on-surface-variant text-sm">
            Connect your GitHub account to enable AI code review and QA automation.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full py-2.5 rounded-full bg-md-primary text-md-on-primary text-sm font-medium hover:shadow-md transition-all disabled:opacity-50"
          >
            {connecting ? 'Connecting...' : 'Connect GitHub'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-md-primary">✓</span>
            <span className="text-md-primary text-sm font-medium">Connected</span>
          </div>
          <div className="flex items-center gap-4">
            {status.avatar_url && (
              <img
                src={status.avatar_url}
                alt="GitHub avatar"
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <div className="text-md-on-surface font-semibold">
                @{status.username || status.login}
              </div>
              <div className="text-xs text-md-on-surface-variant">GitHub Account</div>
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href="/github/repos"
              className="flex-1 py-2.5 rounded-full bg-md-primary text-md-on-primary text-sm text-center font-medium hover:shadow-md transition-all"
            >
              Select Repos →
            </a>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-4 py-2.5 rounded-full bg-md-secondary-container text-md-on-secondary-container text-sm font-medium hover:shadow-sm transition-all disabled:opacity-50"
            >
              {disconnecting ? '...' : 'Disconnect'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
