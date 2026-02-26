import { Link } from 'react-router-dom'

export default function LandingPageView({ content, projectId }) {
  if (!content) return null

  const hero = content.hero || {}
  const headline = hero.headline || content.headline || ''
  const subheadline = hero.subheadline || content.subheadline || ''
  const cta = hero.cta_text || content.cta || 'Get Started'
  const features = (content.features || []).map(f => ({
    icon: f.icon || '✦',
    title: f.headline || f.title || '',
    desc: f.description || f.desc || ''
  }))
  const pricing = content.pricing || {}
  const plans = pricing.plans || []
  const faq = content.faq || []

  return (
    <div className="space-y-5 pt-4">
      {/* Live Site Button */}
      {content.deploy_url && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-md-surface-container rounded-md-lg shadow-sm">
          <div>
            <p className="text-sm font-medium text-md-on-surface">Your landing page is live</p>
            <p className="text-xs text-md-on-surface-variant mt-0.5 truncate">{content.deploy_url}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            {projectId && (
              <Link
                to={`/editor/${projectId}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-md-secondary-container text-md-on-secondary-container rounded-full text-sm font-medium hover:shadow-sm transition-all shrink-0"
              >
                ✏️ Edit Landing Page
              </Link>
            )}
            <a
              href={content.deploy_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-md-primary text-md-on-primary rounded-full text-sm font-medium hover:shadow-md transition-all shrink-0"
            >
              🌐 View Live Site ↗
            </a>
          </div>
        </div>
      )}

      {/* Browser Mockup Preview */}
      {content.deploy_url && (
        <div className="bg-md-surface border border-md-outline-variant rounded-md-lg overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-md-outline-variant bg-md-surface-container">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-md-error/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-md-tertiary/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <div className="flex-1 mx-2">
              <div className="bg-md-surface-variant rounded-full px-3 py-1 text-xs text-md-on-surface-variant text-center truncate">
                {content.deploy_url}
              </div>
            </div>
          </div>
          <div className="relative aspect-[16/9] bg-md-surface-variant">
            <iframe
              src={content.deploy_url}
              className="absolute inset-0 w-full h-full border-0"
              title="Landing Page Preview"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Content Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Hero */}
        <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
          <p className="text-xs text-md-on-surface-variant uppercase mb-2">Hero</p>
          {headline && <h4 className="text-base font-semibold text-md-on-surface mb-1">{headline}</h4>}
          {subheadline && <p className="text-sm text-md-on-surface-variant mb-3">{subheadline}</p>}
          {cta && <span className="inline-block px-4 py-1.5 bg-md-primary text-md-on-primary text-sm rounded-full">{cta}</span>}
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
            <p className="text-xs text-md-on-surface-variant uppercase mb-2">Features ({features.length})</p>
            <div className="space-y-2">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-md-primary">{f.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-md-on-surface">{f.title}</p>
                    <p className="text-xs text-md-on-surface-variant line-clamp-1">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        {plans.length > 0 && (
          <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
            <p className="text-xs text-md-on-surface-variant uppercase mb-2">Pricing ({plans.length} plans)</p>
            <div className="flex flex-wrap gap-2">
              {plans.map((p, i) => (
                <div key={i} className={`px-3 py-2 rounded-md-lg text-sm ${p.highlighted ? 'bg-md-primary-container border border-md-primary' : 'bg-md-surface-variant border border-md-outline-variant'}`}>
                  <span className="font-medium text-md-on-surface">{p.name}</span>
                  <span className="text-md-on-surface-variant ml-2">{p.price}{p.period}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        {faq.length > 0 && (
          <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
            <p className="text-xs text-md-on-surface-variant uppercase mb-2">FAQ ({faq.length} questions)</p>
            <div className="space-y-1">
              {faq.slice(0, 3).map((f, i) => (
                <p key={i} className="text-sm text-md-on-surface-variant truncate">• {f.question}</p>
              ))}
              {faq.length > 3 && <p className="text-xs text-md-on-surface-variant">+{faq.length - 3} more</p>}
            </div>
          </div>
        )}
      </div>

      {/* Sections count */}
      <div className="flex flex-wrap gap-2 text-xs text-md-on-surface-variant">
        {content.navbar && <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-2 py-0.5">✓ Navbar</span>}
        {content.hero && <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-2 py-0.5">✓ Hero</span>}
        {content.problem && <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-2 py-0.5">✓ Problem</span>}
        {content.solution && <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-2 py-0.5">✓ Solution</span>}
        {content.features && <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-2 py-0.5">✓ Features</span>}
        {content.how_it_works && <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-2 py-0.5">✓ How It Works</span>}
        {content.pricing && <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-2 py-0.5">✓ Pricing</span>}
        {content.testimonials && <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-2 py-0.5">✓ Testimonials</span>}
        {content.faq && <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-2 py-0.5">✓ FAQ</span>}
        {content.final_cta && <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container px-2 py-0.5">✓ CTA</span>}
      </div>
    </div>
  )
}
