import { useState } from 'react'

function parseDiff(diff) {
  if (!diff) return []
  return diff.split('\n').map((line, i) => {
    const type = line.startsWith('+') ? 'added' : line.startsWith('-') ? 'removed' : 'context'
    return { text: line, type, key: i }
  })
}

export default function SituationRoom({ projectName, failure, codeContext, aiAnalysis, impactRadius }) {
  const diffLines = parseDiff(codeContext?.diff)
  const errors = failure?.errors || []
  const rawLog = failure?.raw_log || 'No log output available.'

  return (
    <div className="bg-[#0a0a0a] rounded-lg border border-zinc-800 overflow-hidden">
      {/* Split panels */}
      <div className="flex flex-col md:flex-row">
        {/* Left Panel - 40% */}
        <div className="w-full md:w-[40%] border-b md:border-b-0 md:border-r border-zinc-800 bg-[#111111] p-5">
          <h2 className="text-[14px] uppercase tracking-[0.05em] text-zinc-400 mb-4">
            🚨 FAILURE ANALYSIS: {projectName}
          </h2>

          {/* AI Root Cause */}
          {aiAnalysis?.rootCause && (
            <div className="mb-4">
              <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Root Cause</h3>
              <p className="text-sm text-zinc-300 bg-[#0a0a0a] border border-zinc-800 rounded p-3">
                {aiAnalysis.rootCause}
              </p>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 space-y-2">
              {errors.map((err, i) => (
                <div key={i} className="text-sm">
                  <span className="text-red-400 font-mono">{err.name}</span>
                  <span className="text-zinc-500 mx-1">—</span>
                  <span className="text-zinc-300">{err.message}</span>
                  {err.file && (
                    <div className="text-xs text-zinc-500 font-mono mt-0.5">
                      {err.file}{err.line ? `:${err.line}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Terminal Log */}
          <div className="mb-4">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Error Log</h3>
            <pre className="bg-[#0a0a0a] border border-zinc-800 rounded p-3 text-[13px] font-mono text-red-400 overflow-auto max-h-60 whitespace-pre-wrap">
              {rawLog}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              disabled
              className="px-3 py-1.5 text-xs rounded border border-zinc-700 text-zinc-500 cursor-not-allowed bg-zinc-900"
            >
              Explain Fix
            </button>
            <button
              disabled
              className="px-3 py-1.5 text-xs rounded border border-zinc-700 text-zinc-500 cursor-not-allowed bg-zinc-900"
            >
              Generate Patch
            </button>
          </div>
        </div>

        {/* Right Panel - 60% */}
        <div className="w-full md:w-[60%] bg-[#111111] p-5">
          <h2 className="text-[14px] uppercase tracking-[0.05em] text-zinc-400 mb-4">
            Code Context
          </h2>

          {codeContext?.file ? (
            <>
              <div className="flex items-center gap-2 mb-3 text-sm font-mono">
                <span className="text-zinc-300">{codeContext.file}</span>
                {codeContext.line && (
                  <span className="text-zinc-500">L{codeContext.line}</span>
                )}
              </div>

              {/* Diff View */}
              <div className="bg-[#0a0a0a] border border-zinc-800 rounded overflow-auto max-h-96">
                {diffLines.map(({ text, type, key }) => (
                  <div
                    key={key}
                    className={`px-3 py-0.5 font-mono text-[13px] whitespace-pre ${
                      type === 'added'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : type === 'removed'
                        ? 'bg-red-500/10 text-red-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    {text}
                  </div>
                ))}
                {diffLines.length === 0 && (
                  <p className="p-3 text-zinc-500 text-sm">No diff available</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
              No code context available
            </div>
          )}

          {/* Suggested Fix */}
          {aiAnalysis?.suggestedFix && (
            <div className="mt-4">
              <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Suggested Fix</h3>
              <p className="text-sm text-emerald-400 bg-[#0a0a0a] border border-zinc-800 rounded p-3">
                {aiAnalysis.suggestedFix}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar - Impact Radius */}
      <div className="border-t border-zinc-800 bg-[#0a0a0a] px-5 py-3 flex flex-wrap items-center gap-6">
        <h3 className="text-[14px] uppercase tracking-[0.05em] text-zinc-400">Impact Radius</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
          <span className="text-sm text-zinc-300">
            <span className="text-amber-400 font-medium">{impactRadius?.dependentProjects ?? 0}</span> other projects depend on this module
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
          <span className="text-sm text-zinc-300">
            <span className="text-red-400 font-medium">{impactRadius?.affectedTests ?? 0}</span> tests affected
          </span>
        </div>
      </div>
    </div>
  )
}
