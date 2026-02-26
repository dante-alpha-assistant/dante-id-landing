export default function OnboardingStep({ title, subtitle, children }) {
  return (
    <div className="transition-opacity duration-300">
      <h2 className="text-xl font-bold text-md-on-background mb-1">{title}</h2>
      {subtitle && <p className="text-md-on-surface-variant text-sm mb-6">{subtitle}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  )
}
