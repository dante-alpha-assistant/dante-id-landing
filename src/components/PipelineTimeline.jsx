import { useState } from 'react'
import { supabase } from '../lib/supabase'

const STAGES = ['refinery', 'foundry', 'planner', 'builder', 'inspector', 'deployer']

const STATUS_COLORS = {
  completed: 'bg-emerald-500',
  running: 'bg-amber-500',
  failed: 'bg-red-500',
  pending: 'bg-md-border/40',
}

const STATUS_TEXT_COLORS = {
  completed: 'text-emerald-600',
  running: 'text-amber-600',
  failed: 'text-red-500',
  pending: 'text-md-on-surface-variant',
}

function formatDuration(start, end) {
  if (!start) return ''
  const s = new Date(start)
  const e = end ? new Date(end) : new Date()
  const diff = Math.round((e - s) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function PipelineTimeline({ steps, projectId, onRefresh, project }) {
  const isLive = project?.stage === 'launched' || project?.status === 'live'
  const [retrying, setRetrying] = useState(null)

  const stepMap = {}
  for (const s of (steps || [])) {
    if (!stepMap[s.step] || new Date(s.started_at) > new Date(stepMap[s.step].started_at)) {
      stepMap[s.step] = s
    }
  }

  const handleRetry = async (stepName) => {
    setRetrying(stepName)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch(`/api/projects/${projectId}/retry-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ step: stepName }),
      })
      onRefresh?.()
    } catch (e) {
      console.error('Retry failed:', e)
    }
    setRetrying(null)
  }

  if (!steps || steps.length === 0) return null

  return (
    <div className="bg-md-surface-container rounded-md-lg p-6 mb-8 shadow-sm">
      <h3 className="text-base font-bold text-md-on-background mb-4">Pipeline Timeline</h3>

      <div className="relative ml-4">
        {STAGES.map((stage, idx) => {
          const step = stepMap[stage]
          const status = isLive ? 'completed' : (step?.status || 'pending')
          const isLast = idx === STAGES.length - 1

          return (
            <div key={stage} className="relative pb-5">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className={`absolute left-[9px] top-[24px] w-[2px] h-full ${status === 'completed' ? 'bg-emerald-500' : 'bg-md-border/30'}`}
                />
              )}

              <div className="flex items-start gap-3">
                {/* Dot */}
                <div className={`w-5 h-5 rounded-full flex-shrink-0 z-10 flex items-center justify-center ${STATUS_COLORS[status]}`}>
                  {status === 'completed' && <span className="text-white text-xs">✓</span>}
                  {status === 'running' && <span className="text-white text-xs animate-pulse">●</span>}
                  {status === 'failed' && <span className="text-white text-xs">✗</span>}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-sm font-semibold ${STATUS_TEXT_COLORS[status]}`}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </span>

                    {step?.started_at && (
                      <span className="text-xs text-md-on-surface-variant">
                        {formatTime(step.started_at)}
                        {' · '}
                        {formatDuration(step.started_at, step.completed_at)}
                      </span>
                    )}

                    {status === 'running' && (
                      <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs animate-pulse">Running</span>
                    )}
                  </div>

                  {/* Error message + retry */}
                  {status === 'failed' && !isLive && (
                    <div className="mt-1.5">
                      {step?.error_message && (
                        <div className="text-xs text-red-500 break-all bg-red-50 rounded-md-sm p-2 mb-1.5">
                          {step.error_message.slice(0, 200)}
                        </div>
                      )}
                      <button
                        onClick={() => handleRetry(stage)}
                        disabled={retrying === stage}
                        className="rounded-full bg-red-500 text-white px-4 py-1 text-xs font-medium hover:bg-red-600 active:scale-95 transition-all duration-300 disabled:opacity-50"
                      >
                        {retrying === stage ? 'Retrying...' : 'Retry →'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
