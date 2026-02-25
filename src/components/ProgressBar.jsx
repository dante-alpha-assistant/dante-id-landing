export default function ProgressBar({ currentStep, totalSteps }) {
  const filled = Math.round(((currentStep + 1) / totalSteps) * 10)
  const empty = 10 - filled
  const bar = '█'.repeat(filled) + '░'.repeat(empty)

  return (
    <div className="mb-8 font-mono text-sm">
      <div className="text-[#33ff00]">
        [{bar}] {currentStep + 1}/{totalSteps}
      </div>
    </div>
  )
}
