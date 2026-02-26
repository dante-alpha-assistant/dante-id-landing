import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DomainManager({ projectId }) {
  const [domains, setDomains] = useState([])
  const [newDomain, setNewDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!projectId) return
    fetchDomains()
  }, [projectId])

  const fetchDomains = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/domains/${projectId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDomains(data.domains || [])
      }
    } catch (err) {
      console.error('Failed to load domains:', err)
    }
  }

  const checkDomain = async (domain) => {
    try {
      setChecking(true)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/domains/check?domain=${encodeURIComponent(domain)}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      return res.ok ? await res.json() : null
    } catch (err) {
      console.error('Domain check failed:', err)
      return null
    } finally {
      setChecking(false)
    }
  }

  const addDomain = async (e) => {
    e.preventDefault()
    if (!newDomain.trim()) return

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const check = await checkDomain(newDomain.trim())
      if (!check) {
        setError('Failed to check domain availability')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/domains/configure', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          domain: newDomain.trim()
        })
      })

      if (res.ok) {
        const data = await res.json()
        setSuccess(`Domain added! Status: ${data.status}`)
        setNewDomain('')
        fetchDomains()
      } else {
        const err = await res.json()
        setError(err.error || 'Failed to add domain')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyDomain = async (domain) => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          domain
        })
      })

      if (res.ok) {
        const data = await res.json()
        setSuccess(`Domain verified! Status: ${data.verified ? 'active' : 'pending'}`)
        fetchDomains()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-md-on-surface">Custom Domains</h3>
      </div>

      {/* Add Domain Form */}
      <form onSubmit={addDomain} className="flex gap-2">
        <input
          type="text"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="yourdomain.com"
          className="flex-1 rounded-t-lg rounded-b-none border-b-2 border-md-outline bg-md-surface-variant h-14 px-4 text-md-on-surface placeholder-md-on-surface-variant focus:outline-none focus:border-md-primary transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newDomain.trim()}
          className="bg-md-primary hover:shadow-md disabled:opacity-50 text-md-on-primary px-6 rounded-full font-medium transition-all"
        >
          {loading ? 'Adding...' : 'Add Domain'}
        </button>
      </form>

      {checking && (
        <p className="text-sm text-md-on-surface-variant">Checking domain availability...</p>
      )}

      {error && (
        <div className="p-3 bg-md-error-container rounded-md-lg text-md-on-error-container text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-md-secondary-container rounded-md-lg text-md-on-secondary-container text-sm">
          {success}
        </div>
      )}

      {/* Domain List */}
      {domains.length === 0 ? (
        <p className="text-md-on-surface-variant text-sm">No custom domains configured yet.</p>
      ) : (
        <div className="space-y-3">
          {domains.map((domain) => (
            <div key={domain.id} className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🌐</span>
                  <span className="font-medium text-md-on-surface">{domain.domain}</span>
                </div>
                <span className={`rounded-full text-xs px-2 py-0.5 ${
                  domain.status === 'active' 
                    ? 'bg-md-secondary-container text-md-on-secondary-container' 
                    : domain.status === 'pending'
                    ? 'bg-md-tertiary-container text-md-on-tertiary-container'
                    : 'bg-md-error-container text-md-on-error-container'
                }`}>
                  {domain.status}
                </span>
              </div>

              {domain.status === 'pending' && domain.dns_config && (
                <div className="mt-3 p-3 bg-md-surface-variant rounded-md-lg">
                  <p className="text-sm text-md-on-surface-variant mb-2">Add these DNS records:</p>
                  {domain.dns_config.type === 'CNAME' ? (
                    <div className="space-y-2">
                      {domain.dns_config.records.map((record, i) => (
                        <div key={i} className="flex gap-4 text-sm">
                          <span className="text-md-on-surface-variant w-16">Type:</span>
                          <span className="text-md-primary">{record.type}</span>
                        </div>
                      ))}
                      <div className="flex gap-4 text-sm">
                        <span className="text-md-on-surface-variant w-16">Value:</span>
                        <code className="text-md-primary">{domain.dns_config.records[0]?.value}</code>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-md-on-surface-variant">A Records:</p>
                      {domain.dns_config.records.map((record, i) => (
                        <code key={i} className="text-md-primary text-sm block">{record.value}</code>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => verifyDomain(domain.domain)}
                    disabled={loading}
                    className="mt-3 text-sm text-md-primary hover:underline font-medium"
                  >
                    Verify Domain →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
