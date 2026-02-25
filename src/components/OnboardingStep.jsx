export default function OnboardingStep({ title, subtitle, children }) {
  return (
    <div className="transition-opacity duration-300">
      <h2 className="text-xl font-bold text-[#33ff00] mb-1 font-mono uppercase" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>{'>'} {title}</h2>
      {subtitle && <p className="text-[#1a6b1a] text-sm mb-6 font-mono">{subtitle}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  )
}
