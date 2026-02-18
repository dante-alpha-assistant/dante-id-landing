import CopyButton from './CopyButton'

export default function BrandIdentityView({ content }) {
  if (!content) return null

  // Support both v1 (flat) and v2 (Beta) schemas
  const namesList = Array.isArray(content.name_suggestions)
    ? content.name_suggestions.map(n => typeof n === 'string' ? n : n.name || JSON.stringify(n))
    : []

  const colors = Array.isArray(content.color_palette)
    ? content.color_palette
    : content.color_palette
      ? Object.entries(content.color_palette).map(([name, val]) => ({
          name,
          hex: typeof val === 'string' ? val : val?.hex || '#000'
        }))
      : []

  const typography = content.typography || {}
  const headingFont = typography.heading?.font || typography.heading || ''
  const bodyFont = typography.body?.font || typography.body || ''

  const taglines = Array.isArray(content.tagline_options)
    ? content.tagline_options
    : Array.isArray(content.taglines)
      ? content.taglines.map(t => typeof t === 'string' ? t : t.text || '')
      : []

  const brandVoice = typeof content.brand_voice === 'string'
    ? content.brand_voice
    : content.brand_voice?.adjectives
      ? `${content.brand_voice.adjectives.join(', ')}. ${content.brand_voice.speaks_like || ''}`
      : ''

  const allText = [
    namesList.length ? `Names: ${namesList.join(', ')}` : '',
    colors.length ? `Colors: ${colors.map(c => `${c.name} ${c.hex}`).join(', ')}` : '',
    headingFont ? `Heading: ${headingFont}` : '',
    bodyFont ? `Body: ${bodyFont}` : '',
    taglines.length ? `Taglines:\n${taglines.map(t => `- "${t}"`).join('\n')}` : '',
    brandVoice ? `Brand Voice: ${brandVoice}` : '',
  ].filter(Boolean).join('\n\n')

  return (
    <div className="space-y-6 pt-4">
      <div className="flex justify-end"><CopyButton text={allText} label="Copy All" /></div>
      {namesList.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Name Suggestions</h4>
          <div className="flex flex-wrap gap-2">
            {namesList.map((n, i) => (
              <span key={i} className="bg-white/5 border border-[#333] rounded-lg px-3 py-1.5 text-sm">{n}</span>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Color Palette</h4>
          <div className="flex flex-wrap gap-3">
            {colors.map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-lg border border-[#333]" style={{ backgroundColor: c.hex }} />
                <span className="text-xs text-gray-400">{c.name}</span>
                <span className="text-xs text-gray-500 font-mono">{c.hex}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(headingFont || bodyFont) && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Typography</h4>
          <div className="flex gap-4">
            {headingFont && <span className="bg-white/5 border border-[#333] rounded-lg px-3 py-1.5 text-sm">Heading: {headingFont}</span>}
            {bodyFont && <span className="bg-white/5 border border-[#333] rounded-lg px-3 py-1.5 text-sm">Body: {bodyFont}</span>}
          </div>
        </div>
      )}

      {taglines.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Tagline Options</h4>
          <ul className="space-y-1">
            {taglines.map((t, i) => (
              <li key={i} className="text-sm text-gray-300 italic">"{t}"</li>
            ))}
          </ul>
        </div>
      )}

      {brandVoice && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Brand Voice</h4>
          <p className="text-sm text-gray-300 leading-relaxed">{brandVoice}</p>
        </div>
      )}
    </div>
  )
}
