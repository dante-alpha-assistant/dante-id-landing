import { useEffect, useState } from 'react'

export default function Docs() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/docs')
      .then(r => r.text())
      .then(md => { setContent(md); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-[#33ff00] font-mono terminal-blink">[LOADING DOCS...]</div>
    </div>
  )

  // Simple markdown → HTML (headings, code blocks, inline code, bold, links, lists, hr)
  const renderMarkdown = (md) => {
    const lines = md.split('\n')
    const html = []
    let inCodeBlock = false
    let codeBuffer = []
    let codeLanguage = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith('```')) {
        if (inCodeBlock) {
          html.push(`<pre class="bg-[#0d0d0d] border border-[#1f521f] p-4 overflow-x-auto text-xs text-[#22aa00] my-3"><code>${codeBuffer.join('\n').replace(/</g, '&lt;')}</code></pre>`)
          codeBuffer = []
          inCodeBlock = false
        } else {
          inCodeBlock = true
          codeLanguage = line.slice(3).trim()
        }
        continue
      }

      if (inCodeBlock) {
        codeBuffer.push(line)
        continue
      }

      if (line.startsWith('# ')) {
        html.push(`<h1 class="text-2xl font-bold text-[#33ff00] mt-8 mb-4" style="text-shadow: 0 0 5px rgba(51,255,0,0.5)">${line.slice(2)}</h1>`)
      } else if (line.startsWith('## ')) {
        html.push(`<h2 class="text-xl font-bold text-[#33ff00] mt-8 mb-3 border-b border-[#1f521f] pb-2">${line.slice(3)}</h2>`)
      } else if (line.startsWith('### ')) {
        html.push(`<h3 class="text-lg font-bold text-[#33ff00] mt-6 mb-2">${line.slice(4)}</h3>`)
      } else if (line.startsWith('---')) {
        html.push('<hr class="border-[#1f521f] my-6" />')
      } else if (line.startsWith('> ')) {
        html.push(`<blockquote class="border-l-2 border-[#33ff00] pl-4 text-[#22aa00] text-sm my-2">${formatInline(line.slice(2))}</blockquote>`)
      } else if (line.startsWith('- ')) {
        html.push(`<div class="flex gap-2 text-sm text-[#22aa00] ml-4"><span class="text-[#33ff00]">•</span><span>${formatInline(line.slice(2))}</span></div>`)
      } else if (line.trim() === '') {
        html.push('<div class="h-2"></div>')
      } else {
        html.push(`<p class="text-sm text-[#22aa00] my-1">${formatInline(line)}</p>`)
      }
    }
    return html.join('\n')
  }

  const formatInline = (text) => {
    return text
      .replace(/`([^`]+)`/g, '<code class="bg-[#0d0d0d] border border-[#1f521f] px-1 text-[#33ff00] text-xs">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-[#33ff00]">$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#33ff00] underline">$1</a>')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#33ff00] font-mono">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>dante_</span>
            <span className="text-[#1a6b1a]">/</span>
            <span className="text-sm text-[#22aa00]">docs</span>
          </div>
          <div className="flex gap-2">
            <a href="/api/docs" className="text-[10px] border border-[#1f521f] px-2 py-1 text-[#1a6b1a] hover:border-[#33ff00] hover:text-[#33ff00] transition-colors">
              [ RAW MARKDOWN ]
            </a>
            <a href="/" className="text-[10px] border border-[#1f521f] px-2 py-1 text-[#1a6b1a] hover:border-[#33ff00] hover:text-[#33ff00] transition-colors">
              [ HOME ]
            </a>
          </div>
        </div>
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      </div>
    </div>
  )
}
