export default function ProgressBar({ currentStep, totalSteps }) {
  const pct = Math.round(((currentStep + 1) / totalSteps) * 100)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between text-sm text-md-on-surface-variant mb-2">
        <span>Step {currentStep + 1} of {totalSteps}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-md-surface-variant">
        <div
          className="h-2 rounded-full bg-md-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
