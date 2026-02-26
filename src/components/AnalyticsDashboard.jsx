import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AnalyticsDashboard({ projectId }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  useEffect(() => {
    if (!projectId) return
    fetchStats()
  }, [projectId, days])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/analytics/${projectId}?days=${days}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-md-on-surface-variant">
        <div className="animate-pulse">Loading analytics...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6 text-center text-md-on-surface-variant">
        No analytics data available yet.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-md-on-surface">Landing Page Analytics</h3>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="rounded-t-lg rounded-b-none border-b-2 border-md-outline bg-md-surface-variant h-10 px-3 text-sm text-md-on-surface focus:outline-none focus:border-md-primary transition-colors"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Page Views" value={stats.views?.toLocaleString() || '0'} icon="👁️" />
        <StatCard label="Unique Visitors" value={stats.uniqueVisitors?.toLocaleString() || '0'} icon="👤" />
        <StatCard label="CTA Clicks" value={stats.clicks?.toLocaleString() || '0'} icon="🖱️" />
        <StatCard 
          label="CTR" 
          value={`${stats.ctr?.toFixed(1) || '0.0'}%`} 
          icon="📈"
          trend={stats.ctr > 2 ? 'good' : stats.ctr > 1 ? 'ok' : 'low'}
        />
      </div>

      {/* Daily Chart */}
      {stats.daily?.length > 0 && (
        <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
          <h4 className="text-sm font-medium text-md-on-surface-variant mb-4">Daily Traffic</h4>
          <div className="h-40 flex items-end gap-2">
            {stats.daily.map((day, i) => {
              const maxViews = Math.max(...stats.daily.map(d => d.views), 1)
              const height = (day.views / maxViews) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative group">
                    <div 
                      className="bg-md-primary rounded-t-md transition-all hover:bg-md-primary/80"
                      style={{ height: `${Math.max(height, 4)}px` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-md-inverse-surface text-md-inverse-on-surface rounded-md-sm text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {day.views} views
                    </div>
                  </div>
                  <span className="text-[10px] text-md-on-surface-variant">
                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'narrow' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      {stats.ctr < 2 && (
        <div className="p-4 bg-md-tertiary-container rounded-md-lg">
          <p className="text-sm text-md-on-tertiary-container">
            💡 Your CTR is below 2%. Try making your CTA buttons more prominent or testing different copy.
          </p>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, trend }) {
  const trendColors = {
    good: 'text-emerald-600',
    ok: 'text-md-tertiary', 
    low: 'text-md-error'
  }
  
  return (
    <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-md-on-surface-variant uppercase">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${trend ? trendColors[trend] : 'text-md-on-surface'}`}>
        {value}
      </div>
    </div>
  )
}
