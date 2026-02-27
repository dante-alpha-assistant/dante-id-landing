function parseLineNumber(errorMessage) {
  if (!errorMessage) return null
  const match = errorMessage.match(/:(\d+):/) || errorMessage.match(/line (\d+)/i)
  return match ? match[1] : null
}

function TestDetailBlock({ details }) {
  if (!details || !Array.isArray(details) || details.length === 0) return null

  const failingTests = details.filter(t => t.status === 'failed' || t.error_message)

  if (failingTests.length === 0) return null

  return (
    <div className="mb-3">
      <p className="text-md-on-surface-variant text-xs mb-2">Failing Tests:</p>
      <div className="bg-zinc-900 text-zinc-100 font-mono text-xs p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto space-y-1">
        {failingTests.map((t, i) => {
          const line = parseLineNumber(t.error_message)
          const filePath = t.file || t.name || 'unknown'
          const location = line ? `${filePath}:${line}` : filePath
          const msg = t.error_message || 'failed'
          const truncMsg = msg.length > 120 ? msg.slice(0, 120) + '…' : msg
          return (
            <div key={i} className="text-red-300">
              📄 <span className="text-amber-300">{location}</span> — <span className="text-zinc-300">{truncMsg}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function FailureDetail({ failures, latest }) {
  if (!latest) return null

  const hasFailure = latest.build_status === 'failure' ||
    (latest.test_total > 0 && latest.test_passed < latest.test_total) ||
    (latest.lint_errors > 0 && latest.lint_errors > 5)

  if (!hasFailure) return null

  const f = failures?.latest_failure

  // Parse test_details if string
  let testDetails = f?.test_details
  if (typeof testDetails === 'string') {
    try { testDetails = JSON.parse(testDetails) } catch (_) { testDetails = null }
  }

  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-md-lg p-5 mb-8">
      <h3 className="text-red-400 font-semibold text-sm mb-3">🚨 FAILURE ANALYSIS</h3>

      {f ? (
        <>
          <p className="text-md-on-surface-variant text-sm mb-3">
            Type: <span className="text-md-on-background font-medium">
              {f.type === 'test' ? 'Test Failure' : f.type === 'lint' ? 'Lint Issues' : 'Build Failure'}
            </span>
            {f.commit_sha && (
              <span className="ml-3 text-xs text-zinc-400">
                Commit: <a href={`https://github.com/dante-alpha-assistant/dante-id-landing/commit/${f.commit_sha}`} target="_blank" rel="noopener noreferrer" className="text-md-primary hover:underline font-mono">{f.commit_sha.slice(0, 7)}</a>
                {f.commit_author && <> by {f.commit_author}</>}
              </span>
            )}
          </p>

          <TestDetailBlock details={testDetails} />

          {f.errors && f.errors.length > 0 && (
            <div className="mb-3">
              <p className="text-md-on-surface-variant text-xs mb-2">Error Details:</p>
              <div className="bg-zinc-900 text-zinc-100 font-mono text-xs p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                {f.errors.map((err, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-red-400">{err.name}:</span> {err.message}
                  </div>
                ))}
                {f.raw_log && (
                  <pre className="mt-2 text-zinc-400 whitespace-pre-wrap">{f.raw_log}</pre>
                )}
              </div>
            </div>
          )}

          <p className="text-md-on-surface-variant text-xs">
            Run: {f.run_id} — {new Date(f.created_at).toLocaleString()}
          </p>
        </>
      ) : (
        <p className="text-md-on-surface-variant text-sm">
          Build failed. Structured error data not yet available for this run.
        </p>
      )}
    </div>
  )
}
