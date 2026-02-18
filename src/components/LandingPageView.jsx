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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/5 border border-[#333] rounded-lg">
          <div>
            <p className="text-sm font-medium text-white">Your landing page is live</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{content.deploy_url}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            {projectId && (
              <Link
                to={`/editor/${projectId}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
              >
                ✏️ Edit Landing Page
              </Link>
            )}
            <a
              href={content.deploy_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              🌐 View Live Site ↗
            </a>
          </div>
        </div>
      )}

      {/* Browser Mockup Preview */}
      {content.deploy_url && (
        <div className="bg-[#0a0a0a] border border-[#333] rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#333]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 mx-2">
              <div className="bg-[#1a1a1a] rounded px-3 py-1 text-xs text-gray-500 text-center truncate">
                {content.deploy_url}
              </div>
            </div>
          </div>
          <div className="relative aspect-[16/9] bg-[#111]">
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
        <div className="bg-white/5 border border-[#333] rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase mb-2">Hero</p>
          {headline && <h4 className="text-base font-semibold text-white mb-1">{headline}</h4>}
          {subheadline && <p className="text-sm text-gray-400 mb-3">{subheadline}</p>}
          {cta && <span className="inline-block px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg">{cta}</span>}
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="bg-white/5 border border-[#333] rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Features ({features.length})</p>
            <div className="space-y-2">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-blue-400">{f.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{f.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        {plans.length > 0 && (
          <div className="bg-white/5 border border-[#333] rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Pricing ({plans.length} plans)</p>
            <div className="flex flex-wrap gap-2">
              {plans.map((p, i) => (
                <div key={i} className={`px-3 py-2 rounded-lg text-sm ${p.highlighted ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-white/5 border border-[#333]'}`}>
                  <span className="font-medium text-white">{p.name}</span>
                  <span className="text-gray-400 ml-2">{p.price}{p.period}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        {faq.length > 0 && (
          <div className="bg-white/5 border border-[#333] rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase mb-2">FAQ ({faq.length} questions)</p>
            <div className="space-y-1">
              {faq.slice(0, 3).map((f, i) => (
                <p key={i} className="text-sm text-gray-400 truncate">• {f.question}</p>
              ))}
              {faq.length > 3 && <p className="text-xs text-gray-600">+{faq.length - 3} more</p>}
            </div>
          </div>
        )}
      </div>

      {/* Sections count */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
        {content.navbar && <span className="px-2 py-1 bg-white/5 rounded">✓ Navbar</span>}
        {content.hero && <span className="px-2 py-1 bg-white/5 rounded">✓ Hero</span>}
        {content.problem && <span className="px-2 py-1 bg-white/5 rounded">✓ Problem</span>}
        {content.solution && <span className="px-2 py-1 bg-white/5 rounded">✓ Solution</span>}
        {content.features && <span className="px-2 py-1 bg-white/5 rounded">✓ Features</span>}
        {content.how_it_works && <span className="px-2 py-1 bg-white/5 rounded">✓ How It Works</span>}
        {content.pricing && <span className="px-2 py-1 bg-white/5 rounded">✓ Pricing</span>}
        {content.testimonials && <span className="px-2 py-1 bg-white/5 rounded">✓ Testimonials</span>}
        {content.faq && <span className="px-2 py-1 bg-white/5 rounded">✓ FAQ</span>}
        {content.final_cta && <span className="px-2 py-1 bg-white/5 rounded">✓ CTA</span>}
      </div>
    </div>
  )
}
