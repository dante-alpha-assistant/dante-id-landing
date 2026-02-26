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
        return <span className="text-emerald-500">●</span>
      case 'pending':
        return <span className="text-md-tertiary animate-pulse">◐</span>
      case 'error':
        return <span className="text-md-error">✗</span>
      default:
        return <span className="text-md-on-surface-variant">○</span>
    }
  }

  const getWebhookStatusText = (status) => {
    switch (status) {
      case 'connected':
        return <span className="text-emerald-600">Webhook Active</span>
      case 'pending':
        return <span className="text-md-tertiary">Webhook Pending</span>
      case 'error':
        return <span className="text-md-error">Webhook Error</span>
      default:
        return <span className="text-md-on-surface-variant">Webhook Inactive</span>
    }
  }

  return (
    <div className="min-h-screen bg-md-background text-md-on-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-md-outline-variant">
        <span className="text-xl font-bold tracking-tight text-md-on-background">
          dante<span className="text-md-primary">.id</span>
        </span>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm rounded-full bg-md-secondary-container text-md-on-secondary-container px-4 py-2 font-medium hover:shadow-sm transition-all"
        >
          ← Back
        </button>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto mt-10 px-4 pb-16">
        <div className="bg-md-surface-container rounded-md-lg p-6 shadow-sm">
          <h1 className="text-lg font-bold text-md-on-surface mb-2">
            Select Repositories
          </h1>
          <p className="text-md-on-surface-variant text-sm mb-6">
            Enable AI QA automation on your repositories. Toggle to enable or disable webhook integration.
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-md-on-surface-variant animate-pulse">Fetching repositories...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <span className="text-md-tertiary">⚠</span>
              <p className="text-md-tertiary mt-2">{error}</p>
              <button
                onClick={fetchRepos}
                className="mt-4 px-4 py-2 rounded-full bg-md-secondary-container text-md-on-secondary-container font-medium hover:shadow-sm transition-all"
              >
                Retry
              </button>
            </div>
          ) : repos.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-md-outline-variant rounded-md-lg">
              <span className="text-2xl">📦</span>
              <p className="text-md-on-surface-variant mt-2">No repositories found</p>
              <p className="text-md-on-surface-variant text-xs mt-1">
                Make sure your GitHub account has access to repositories.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-md-surface rounded-md-lg p-4 flex items-center justify-between gap-4 border border-md-outline-variant"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-md-tertiary">
                        {repo.is_private ? '🔒' : '📖'}
                      </span>
                      <span className="text-md-on-surface font-semibold truncate" title={`${repo.owner}/${repo.name}`}>
                        {repo.owner}/{repo.name}
                      </span>
                      {repo.is_private ? (
                        <span className="rounded-full bg-md-tertiary-container text-md-on-tertiary-container text-xs px-2 py-0.5">
                          Private
                        </span>
                      ) : (
                        <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs px-2 py-0.5">
                          Public
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
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      repo.enabled
                        ? 'bg-md-primary'
                        : 'bg-md-surface-variant'
                    } disabled:opacity-50`}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 rounded-full transition-all bg-white shadow-sm ${
                        repo.enabled
                          ? 'left-[calc(100%-1.625rem)]'
                          : 'left-0.5'
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
        </div>

        {/* Legend */}
        <div className="mt-6 text-xs text-md-on-surface-variant">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="text-emerald-500">●</span> Connected
            </span>
            <span className="flex items-center gap-1">
              <span className="text-md-tertiary">◐</span> Pending
            </span>
            <span className="flex items-center gap-1">
              <span className="text-md-error">✗</span> Error
            </span>
            <span className="flex items-center gap-1">
              <span className="text-md-on-surface-variant">○</span> Inactive
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
