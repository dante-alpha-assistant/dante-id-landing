export default function BrandIdentityView({ content }) {
  if (!content) return null
  const { name_suggestions, color_palette, typography, tagline_options, brand_voice } = content

  return (
    <div className="space-y-6 pt-4">
      {name_suggestions?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Name Suggestions</h4>
          <div className="flex flex-wrap gap-2">
            {name_suggestions.map((n, i) => (
              <span key={i} className="bg-white/5 border border-[#333] rounded-lg px-3 py-1.5 text-sm">{n}</span>
            ))}
          </div>
        </div>
      )}

      {color_palette?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Color Palette</h4>
          <div className="flex flex-wrap gap-3">
            {color_palette.map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-lg border border-[#333]" style={{ backgroundColor: c.hex }} />
                <span className="text-xs text-gray-400">{c.name}</span>
                <span className="text-xs text-gray-500 font-mono">{c.hex}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {typography && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Typography</h4>
          <div className="flex gap-4">
            {typography.heading && <span className="bg-white/5 border border-[#333] rounded-lg px-3 py-1.5 text-sm">Heading: {typography.heading}</span>}
            {typography.body && <span className="bg-white/5 border border-[#333] rounded-lg px-3 py-1.5 text-sm">Body: {typography.body}</span>}
          </div>
        </div>
      )}

      {tagline_options?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Tagline Options</h4>
          <ul className="space-y-1">
            {tagline_options.map((t, i) => (
              <li key={i} className="text-sm text-gray-300 italic">"{t}"</li>
            ))}
          </ul>
        </div>
      )}

      {brand_voice && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Brand Voice</h4>
          <p className="text-sm text-gray-300 leading-relaxed">{brand_voice}</p>
        </div>
      )}
    </div>
  )
}
