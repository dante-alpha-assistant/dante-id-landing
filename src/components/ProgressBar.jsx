export default function ProgressBar({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-[#333]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              i <= currentStep ? 'bg-violet-500 w-full' : 'w-0'
            }`}
          />
        </div>
      ))}
      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
        {currentStep + 1}/{totalSteps}
      </span>
    </div>
  );
}
