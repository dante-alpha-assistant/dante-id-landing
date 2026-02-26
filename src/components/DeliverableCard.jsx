import BrandIdentityView from './BrandIdentityView'
import LandingPageView from './LandingPageView'
import BusinessPlanView from './BusinessPlanView'
import GrowthStrategyView from './GrowthStrategyView'
import PersonalBrandView from './PersonalBrandView'
import PitchDeckView from './PitchDeckView'
import CompetitorAnalysisView from './CompetitorAnalysisView'

const icons = {
  brand_identity: '🎨',
  landing_page: '🌐',
  business_plan: '📊',
  growth_strategy: '🚀',
  personal_brand: '🧑💼',
  pitch_deck: '📑',
  competitor_analysis: '🏆',
}

const titles = {
  brand_identity: 'Brand Identity',
  landing_page: 'Landing Page',
  business_plan: 'Business Plan',
  growth_strategy: 'Growth Strategy',
  personal_brand: 'Personal Brand Kit',
  pitch_deck: 'Pitch Deck',
  competitor_analysis: 'Competitor Analysis',
}

const badgeStyles = {
  pending: 'bg-md-surface-variant text-md-on-surface-variant',
  generating: 'bg-md-tertiary-container text-md-on-tertiary-container animate-pulse',
  completed: 'bg-md-secondary-container text-md-on-secondary-container',
  failed: 'bg-md-error-container text-md-on-error-container',
}

const views = {
  brand_identity: BrandIdentityView,
  landing_page: LandingPageView,
  business_plan: BusinessPlanView,
  growth_strategy: GrowthStrategyView,
  personal_brand: PersonalBrandView,
  pitch_deck: PitchDeckView,
  competitor_analysis: CompetitorAnalysisView,
}

export default function DeliverableCard({ deliverable, onToggle, isExpanded, onRetry }) {
  const { type, status, content } = deliverable
  const View = views[type]

  return (
    <div className="bg-md-surface-container rounded-md-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icons[type] || '📦'}</span>
          <span className="font-medium text-md-on-surface">{titles[type] || type}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'failed' && onRetry && (
            <button
              onClick={(e) => { e.stopPropagation(); onRetry(); }}
              className="px-3 py-1 text-xs font-medium rounded-full bg-md-error text-md-on-error hover:shadow-sm transition-all"
            >
              ↻ Retry
            </button>
          )}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyles[status] || badgeStyles.pending}`}>
            {status}
          </span>
        </div>
      </button>

      {(status === 'generating' || status === 'pending') && (
        <div className="mt-4 flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-md-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-md-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-md-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-md-on-surface-variant">{status === 'generating' ? 'AI is working on this...' : 'Queued'}</span>
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
