import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
// Placeholder: ActivityItem (auto-inlined)
// Placeholder: ActivityFilters (auto-inlined)
// Placeholder: ActivityLoadingState (auto-inlined)
// Placeholder: ActivityEmptyState (auto-inlined)

type ActivityEvent = {
  id: string
  created_at: string
  event_type: string
  stage?: string
  description: string
  metadata: any
  severity: string
  project_id: string
  project_name?: string
}

type ActivityFeedProps = {
  maxItems: number
  refreshInterval: number
  showFilters: boolean
  projectId?: string
}

export default function ActivityFeed({ maxItems, refreshInterval, showFilters, projectId }: ActivityFeedProps) {
  const { user } = useAuth()
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    projects: [] as string[],
    eventTypes: [] as string[],
    search: ''
  })
  const [projects, setProjects] = useState<any[]>([])

  const loadEvents = async () => {
    try {
      let query = supabase
        .from('activity_log')
        .select(`
          id,
          created_at,
          event_type,
          stage,
          description,
          metadata,
          severity,
          project_id,
          projects(name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(maxItems)

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      if (filters.projects.length > 0) {
        query = query.in('project_id', filters.projects)
      }

      if (filters.eventTypes.length > 0) {
        query = query.in('event_type', filters.eventTypes)
      }

      if (filters.search) {
        query = query.ilike('description', `%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedEvents = data?.map(event => ({
        ...event,
        project_name: event.projects?.name || 'Unknown Project'
      })) || []

      setEvents(formattedEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user?.id)

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  useEffect(() => {
    if (user) {
      loadEvents()
      if (showFilters) {
        loadProjects()
      }
    }
  }, [user, filters, projectId])

  useEffect(() => {
    if (!refreshInterval) return

    const interval = setInterval(() => {
      loadEvents()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, filters])

  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('activity_log_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'activity_log',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          loadEvents()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  if (loading) {
    return <ActivityLoadingState itemCount={5} />
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <ActivityFilters
          projects={projects}
          activeFilters={filters}
          onFilterChange={setFilters}
        />
      )}

      {events.length === 0 ? (
        <ActivityEmptyState 
          hasFilters={Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f)}
          onClearFilters={() => setFilters({ projects: [], eventTypes: [], search: '' })}
        />
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Activity ({events.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {events.map((event) => (
              <ActivityItem
                key={event.id}
                event={event}
                showProject={!projectId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
function ActivityItem(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ActivityItem]</div>; }

function ActivityFilters(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ActivityFilters]</div>; }

function ActivityLoadingState(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ActivityLoadingState]</div>; }

function ActivityEmptyState(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ActivityEmptyState]</div>; }
