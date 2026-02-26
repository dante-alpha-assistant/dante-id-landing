import CopyButton from './CopyButton'

export default function BrandIdentityView({ content }) {
  if (!content) return null

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
          <h4 className="text-sm font-medium text-md-on-surface-variant mb-2">Name Suggestions</h4>
          <div className="flex flex-wrap gap-2">
            {namesList.map((n, i) => (
              <span key={i} className="rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs px-3 py-1.5">{n}</span>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-md-on-surface-variant mb-2">Color Palette</h4>
          <div className="flex flex-wrap gap-3">
            {colors.map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-md-lg border border-md-outline-variant shadow-sm" style={{ backgroundColor: c.hex }} />
                <span className="text-xs text-md-on-surface-variant">{c.name}</span>
                <span className="text-xs text-md-on-surface-variant">{c.hex}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(headingFont || bodyFont) && (
        <div>
          <h4 className="text-sm font-medium text-md-on-surface-variant mb-2">Typography</h4>
          <div className="flex gap-4">
            {headingFont && <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs px-3 py-1.5">Heading: {headingFont}</span>}
            {bodyFont && <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs px-3 py-1.5">Body: {bodyFont}</span>}
          </div>
        </div>
      )}

      {taglines.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-md-on-surface-variant mb-2">Tagline Options</h4>
          <ul className="space-y-1">
            {taglines.map((t, i) => (
              <li key={i} className="text-sm text-md-on-surface italic">"{t}"</li>
            ))}
          </ul>
        </div>
      )}

      {brandVoice && (
        <div>
          <h4 className="text-sm font-medium text-md-on-surface-variant mb-2">Brand Voice</h4>
          <p className="text-sm text-md-on-surface leading-relaxed">{brandVoice}</p>
        </div>
      )}
    </div>
  )
}
