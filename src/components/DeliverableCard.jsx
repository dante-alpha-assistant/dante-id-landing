import BrandIdentityView from './BrandIdentityView'
import LandingPageView from './LandingPageView'
import BusinessPlanView from './BusinessPlanView'
import GrowthStrategyView from './GrowthStrategyView'
import PersonalBrandView from './PersonalBrandView'

const icons = {
  brand_identity: '🎨',
  landing_page: '🌐',
  business_plan: '📊',
  growth_strategy: '🚀',
  personal_brand: '🧑‍💼',
}

const titles = {
  brand_identity: 'Brand Identity',
  landing_page: 'Landing Page',
  business_plan: 'Business Plan',
  growth_strategy: 'Growth Strategy',
  personal_brand: 'Personal Brand Kit',
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
  personal_brand: PersonalBrandView,
}

export default function DeliverableCard({ deliverable, onToggle, isExpanded, onRetry }) {
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
        <div className="flex items-center gap-2">
          {status === 'failed' && onRetry && (
            <button
              onClick={(e) => { e.stopPropagation(); onRetry(); }}
              className="px-3 py-1 text-xs font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-full transition-colors"
            >
              ↻ Retry
            </button>
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyles[status] || badgeStyles.pending}`}>
            {status}
          </span>
        </div>
      </button>

      {(status === 'generating' || status === 'pending') && (
        <div className="mt-4 flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-gray-500">{status === 'generating' ? 'AI is working on this...' : 'Queued'}</span>
        </div>
      )}

      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isExpanded && status === 'completed' ? '4000px' : '0', opacity: isExpanded && status === 'completed' ? 1 : 0 }}
      >
        {View && content && <View content={content} projectId={deliverable.project_id} />}
      </div>
    </div>
  )
}
