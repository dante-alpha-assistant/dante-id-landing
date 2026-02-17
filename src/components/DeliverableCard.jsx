import BrandIdentityView from './BrandIdentityView'
import LandingPageView from './LandingPageView'
import BusinessPlanView from './BusinessPlanView'
import GrowthStrategyView from './GrowthStrategyView'

const icons = {
  brand_identity: '🎨',
  landing_page: '🌐',
  business_plan: '📊',
  growth_strategy: '🚀',
}

const titles = {
  brand_identity: 'Brand Identity',
  landing_page: 'Landing Page',
  business_plan: 'Business Plan',
  growth_strategy: 'Growth Strategy',
}

const badgeStyles = {
  pending: 'bg-gray-800 text-gray-400',
  generating: 'bg-blue-900/50 text-blue-400 animate-pulse',
  completed: 'bg-green-900/50 text-green-400',
  failed: 'bg-red-900/50 text-red-400',
}

const views = {
  brand_identity: BrandIdentityView,
  landing_page: LandingPageView,
  business_plan: BusinessPlanView,
  growth_strategy: GrowthStrategyView,
}

export default function DeliverableCard({ deliverable, onToggle, isExpanded }) {
  const { type, status, content } = deliverable
  const View = views[type]

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-6">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icons[type] || '📦'}</span>
          <span className="font-medium text-white">{titles[type] || type}</span>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[status] || badgeStyles.pending}`}>
          {status}
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isExpanded && status === 'completed' ? '2000px' : '0', opacity: isExpanded && status === 'completed' ? 1 : 0 }}
      >
        {View && content && <View content={content} />}
      </div>
    </div>
  )
}
