export default function OnboardingStep({ title, subtitle, children }) {
  return (
    <div className="transition-opacity duration-300">
      <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
      {subtitle && <p className="text-gray-400 text-sm mb-6">{subtitle}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
