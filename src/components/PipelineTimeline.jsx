import { useState } from 'react'
import { supabase } from '../lib/supabase'

const STAGES = ['refinery', 'foundry', 'planner', 'builder', 'inspector', 'deployer']

const STATUS_ICONS = {
  completed: '✅',
  running: '⏳',
  failed: '❌',
  pending: '⏸',
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
    // Keep latest per stage
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
    <div className="border border-[#1f521f] bg-[#0f0f0f] p-6 mb-8">
      <div className="text-xs text-[#1a6b1a] mb-4">
        +--- PIPELINE TIMELINE ---+
      </div>

      <div className="relative ml-4">
        {STAGES.map((stage, idx) => {
          const step = stepMap[stage]
          const status = isLive ? 'completed' : (step?.status || 'pending')
          const icon = STATUS_ICONS[status]
          const isLast = idx === STAGES.length - 1

          return (
            <div key={stage} className="relative pb-4">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className="absolute left-[9px] top-[22px] w-[2px] h-full"
                  style={{ backgroundColor: status === 'completed' ? '#33ff00' : '#1f521f' }}
                />
              )}

              <div className="flex items-start gap-3">
                {/* Icon */}
                <span className="text-base w-5 flex-shrink-0 z-10">{icon}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className="text-sm font-bold"
                      style={{
                        color: status === 'completed' ? '#33ff00' : status === 'running' ? '#ffb000' : status === 'failed' ? '#ff3333' : '#1a6b1a',
                      }}
                    >
                      {stage.toUpperCase()}
                    </span>

                    {step?.started_at && (
                      <span className="text-xs text-[#1a6b1a]">
                        {formatTime(step.started_at)}
                        {' · '}
                        {formatDuration(step.started_at, step.completed_at)}
                      </span>
                    )}
                  </div>

                  {/* Error message + retry (hidden on live projects) */}
                  {status === 'failed' && !isLive && (
                    <div className="mt-1">
                      {step?.error_message && (
                        <div className="text-xs text-[#ff3333] break-all">
                          ERR: {step.error_message.slice(0, 200)}
                        </div>
                      )}
                      <button
                        onClick={() => handleRetry(stage)}
                        disabled={retrying === stage}
                        className="mt-1 text-xs border border-[#ff3333] text-[#ff3333] px-2 py-0.5 hover:bg-[#ff3333] hover:text-[#0a0a0a] transition-colors disabled:opacity-50"
                      >
                        {retrying === stage ? '[ RETRYING... ]' : '[ RETRY → ]'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-xs text-[#1a6b1a] mt-2">+{'─'.repeat(30)}+</div>
    </div>
  )
}
