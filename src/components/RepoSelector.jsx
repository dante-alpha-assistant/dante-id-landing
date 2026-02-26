import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RepoSelector() {
  const navigate = useNavigate()
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [togglingRepo, setTogglingRepo] = useState(null)

  const fetchRepos = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/api/github/repos', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setRepos(data.repos || [])
      }
    } catch (e) {
      console.error('Failed to fetch repos:', e)
      setError('Failed to load repositories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRepos()
  }, [])

  const handleToggle = async (repo) => {
    setTogglingRepo(repo.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const endpoint = repo.enabled
        ? `/api/github/repos/${repo.id}/disable`
        : `/api/github/repos/${repo.id}/enable`
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      
      if (res.ok) {
        // Update local state
        setRepos(prev => prev.map(r => 
          r.id === repo.id 
            ? { ...r, enabled: !r.enabled, webhook_status: repo.enabled ? 'disconnected' : 'pending' }
            : r
        ))
      } else {
        const data = await res.json()
        console.error('Toggle failed:', data.error)
      }
    } catch (e) {
      console.error('Failed to toggle repo:', e)
    } finally {
      setTogglingRepo(null)
    }
  }

  const getWebhookStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <span className="text-[#33ff00]">●</span>
      case 'pending':
        return <span className="text-[#ffb000] animate-pulse">◐</span>
      case 'error':
        return <span className="text-red-500">✗</span>
      default:
        return <span className="text-[#1a6b1a]">○</span>
    }
  }

  const getWebhookStatusText = (status) => {
    switch (status) {
      case 'connected':
        return <span className="text-[#33ff00]">WEBHOOK ACTIVE</span>
      case 'pending':
        return <span className="text-[#ffb000]">WEBHOOK PENDING</span>
      case 'error':
        return <span className="text-red-500">WEBHOOK ERROR</span>
      default:
        return <span className="text-[#1a6b1a]">WEBHOOK INACTIVE</span>
    }
  }

  const glowStyle = { textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f521f]">
        <span className="text-xl font-bold tracking-tight" style={glowStyle}>
          dante<span className="text-[#ffb000]">.id</span>
        </span>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-[#22aa00] hover:bg-[#33ff00] hover:text-[#0a0a0a] border border-[#1f521f] px-3 py-1 transition-colors uppercase"
        >
          [ ← BACK ]
        </button>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto mt-10 px-4 pb-16">
        <div className="border border-[#1f521f] bg-[#0f0f0f] p-6">
          <div className="text-xs text-[#1a6b1a] mb-4">+--- REPOSITORY SELECTOR ---+</div>

          <h1 className="text-lg font-bold mb-2" style={glowStyle}>
            [ SELECT REPOSITORIES ]
          </h1>
          <p className="text-[#22aa00] text-sm mb-6">
            Enable AI QA automation on your repositories. Toggle to enable or disable webhook integration.
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-[#33ff00] terminal-blink">[FETCHING REPOSITORIES...]</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <span className="text-[#ffb000]">⚠</span>
              <p className="text-[#ffb000] mt-2">{error}</p>
              <button
                onClick={fetchRepos}
                className="mt-4 px-4 py-2 border border-[#1f521f] text-[#22aa00] hover:border-[#33ff00] hover:text-[#33ff00] transition-colors"
              >
                [ RETRY ]
              </button>
            </div>
          ) : repos.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#1f521f]">
              <span className="text-[#1a6b1a] text-2xl">📦</span>
              <p className="text-[#22aa00] mt-2">No repositories found</p>
              <p className="text-[#1a6b1a] text-xs mt-1">
                Make sure your GitHub account has access to repositories.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="border border-[#1f521f] bg-[#0a0a0a] p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[#ffb000]">
                        {repo.is_private ? '🔒' : '📖'}
                      </span>
                      <span className="text-[#33ff00] font-bold truncate" title={`${repo.owner}/${repo.name}`}>
                        {repo.owner}/{repo.name}
                      </span>
                      {repo.is_private ? (
                        <span className="text-[10px] border border-[#ffb000]/40 text-[#ffb000] px-1.5 py-0.5">
                          PRIVATE
                        </span>
                      ) : (
                        <span className="text-[10px] border border-[#1f521f] text-[#1a6b1a] px-1.5 py-0.5">
                          PUBLIC
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {getWebhookStatusIcon(repo.webhook_status)}
                      <span className="text-xs">{getWebhookStatusText(repo.webhook_status)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(repo)}
                    disabled={togglingRepo === repo.id}
                    className={`relative w-14 h-7 border transition-colors ${
                      repo.enabled
                        ? 'border-[#33ff00] bg-[#33ff00]/10'
                        : 'border-[#1f521f] bg-[#0f0f0f]'
                    } disabled:opacity-50`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 border transition-all ${
                        repo.enabled
                          ? 'left-[calc(100%-1.375rem)] border-[#33ff00] bg-[#33ff00]'
                          : 'left-0.5 border-[#1f521f] bg-[#1f521f]'
                      }`}
                    />
                    <span className="sr-only">
                      {repo.enabled ? 'Disable' : 'Enable'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-[#1a6b1a] mt-6">+{'─'.repeat(27)}+</div>
        </div>

        {/* Legend */}
        <div className="mt-6 text-xs text-[#1a6b1a]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="text-[#33ff00]">●</span> Connected
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[#ffb000]">◐</span> Pending
            </span>
            <span className="flex items-center gap-1">
              <span className="text-red-500">✗</span> Error
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[#1a6b1a]">○</span> Inactive
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
