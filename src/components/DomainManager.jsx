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
      // Check availability first
      const check = await checkDomain(newDomain.trim())
      if (!check) {
        setError('Failed to check domain availability')
        return
      }

      // Configure domain
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
        <h3 className="text-lg font-semibold text-white">Custom Domains</h3>
      </div>

      {/* Add Domain Form */}
      <form onSubmit={addDomain} className="flex gap-2">
        <input
          type="text"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="yourdomain.com"
          className="flex-1 bg-[#222] border border-[#333] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newDomain.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Adding...' : 'Add Domain'}
        </button>
      </form>

      {checking && (
        <p className="text-sm text-gray-500">Checking domain availability...</p>
      )}

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-900/20 border border-green-800/50 rounded-lg text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Domain List */}
      {domains.length === 0 ? (
        <p className="text-gray-500 text-sm">No custom domains configured yet.</p>
      ) : (
        <div className="space-y-3">
          {domains.map((domain) => (
            <div key={domain.id} className="bg-[#111] border border-[#222] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🌐</span>
                  <span className="font-medium text-white">{domain.domain}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  domain.status === 'active' 
                    ? 'bg-green-900/50 text-green-400' 
                    : domain.status === 'pending'
                    ? 'bg-yellow-900/50 text-yellow-400'
                    : 'bg-red-900/50 text-red-400'
                }`}>
                  {domain.status}
                </span>
              </div>

              {domain.status === 'pending' && domain.dns_config && (
                <div className="mt-3 p-3 bg-[#0a0a0a] rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Add these DNS records:</p>
                  {domain.dns_config.type === 'CNAME' ? (
                    <div className="space-y-2">
                      {domain.dns_config.records.map((record, i) => (
                        <div key={i} className="flex gap-4 text-sm">
                          <span className="text-gray-500 w-16">Type:</span>
                          <span className="text-blue-400">{record.type}</span>
                        </div>
                      ))}
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-500 w-16">Value:</span>
                        <code className="text-green-400">{domain.dns_config.records[0]?.value}</code>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">A Records:</p>
                      {domain.dns_config.records.map((record, i) => (
                        <code key={i} className="text-green-400 text-sm block">{record.value}</code>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => verifyDomain(domain.domain)}
                    disabled={loading}
                    className="mt-3 text-sm text-blue-400 hover:text-blue-300"
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
