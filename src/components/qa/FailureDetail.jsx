export default function FailureDetail({ failures, latest }) {
  if (!latest) return null

  const hasFailure = latest.build_status === 'failure' ||
    (latest.test_total > 0 && latest.test_passed < latest.test_total) ||
    (latest.lint_errors > 0 && latest.lint_errors > 5)

  if (!hasFailure) return null

  const f = failures?.latest_failure

  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-md-lg p-5 mb-8">
      <h3 className="text-red-400 font-semibold text-sm mb-3">🚨 FAILURE ANALYSIS</h3>

      {f ? (
        <>
          <p className="text-md-on-surface-variant text-sm mb-3">
            Type: <span className="text-md-on-background font-medium">
              {f.type === 'test' ? 'Test Failure' : f.type === 'lint' ? 'Lint Issues' : 'Build Failure'}
            </span>
          </p>

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
