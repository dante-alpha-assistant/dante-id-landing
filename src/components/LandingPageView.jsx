export default function LandingPageView({ content }) {
  if (!content) return null
  const { headline, subheadline, features, cta, html } = content

  const handlePreview = () => {
    if (!html) return
    const blob = new Blob([html], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank')
  }

  return (
    <div className="space-y-5 pt-4">
      {content.deploy_url && (
        <div className="mb-6">
          <a 
            href={content.deploy_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
          >
            🌐 View Live Site
            <span className="text-xs opacity-75">↗</span>
          </a>
          <p className="text-xs text-gray-500 mt-2">{content.deploy_url}</p>
        </div>
      )}
      {headline && <h3 className="text-lg font-semibold text-white">{headline}</h3>}
      {subheadline && <p className="text-sm text-gray-400">{subheadline}</p>}

      {features?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Features</h4>
          <div className="space-y-2">
            {features.map((f, i) => (
              <div key={i} className="bg-white/5 border border-[#333] rounded-lg p-3">
                <div className="text-sm font-medium text-white">{f.title}</div>
                <div className="text-xs text-gray-400 mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cta && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-1">Call to Action</h4>
          <span className="inline-block bg-blue-600 text-white text-sm rounded-lg px-4 py-2">{cta}</span>
        </div>
      )}

      {html && (
        <button
          onClick={handlePreview}
          className="mt-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg px-4 py-2 transition-colors"
        >
          🌐 Preview HTML
        </button>
      )}
    </div>
  )
}
