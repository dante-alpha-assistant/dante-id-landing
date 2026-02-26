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
    <div className="min-h-screen bg-md-background flex items-center justify-center">
      <div className="text-md-primary animate-pulse">Loading docs...</div>
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
          html.push(`<pre class="bg-md-surface-container border border-md-border/20 rounded-[12px] p-4 overflow-x-auto text-xs text-md-on-background my-3"><code>${codeBuffer.join('\n').replace(/</g, '&lt;')}</code></pre>`)
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
        html.push(`<h1 class="text-2xl font-bold text-md-on-background mt-8 mb-4">${line.slice(2)}</h1>`)
      } else if (line.startsWith('## ')) {
        html.push(`<h2 class="text-xl font-bold text-md-on-background mt-8 mb-3 border-b border-md-border/20 pb-2">${line.slice(3)}</h2>`)
      } else if (line.startsWith('### ')) {
        html.push(`<h3 class="text-lg font-bold text-md-on-background mt-6 mb-2">${line.slice(4)}</h3>`)
      } else if (line.startsWith('---')) {
        html.push('<hr class="border-md-border/20 my-6" />')
      } else if (line.startsWith('> ')) {
        html.push(`<blockquote class="border-l-2 border-md-primary pl-4 text-md-on-surface-variant text-sm my-2">${formatInline(line.slice(2))}</blockquote>`)
      } else if (line.startsWith('- ')) {
        html.push(`<div class="flex gap-2 text-sm text-md-on-background ml-4"><span class="text-md-primary">•</span><span>${formatInline(line.slice(2))}</span></div>`)
      } else if (line.trim() === '') {
        html.push('<div class="h-2"></div>')
      } else {
        html.push(`<p class="text-sm text-md-on-background my-1">${formatInline(line)}</p>`)
      }
    }
    return html.join('\n')
  }

  const formatInline = (text) => {
    return text
      .replace(/`([^`]+)`/g, '<code class="bg-md-surface-container border border-md-border/20 px-1.5 py-0.5 rounded text-md-primary text-xs">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-md-on-background font-semibold">$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-md-primary underline hover:opacity-80">$1</a>')
  }

  return (
    <div className="min-h-screen bg-md-background text-md-on-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold">dante.</span>
            <span className="text-md-border/40">/</span>
            <span className="text-sm text-md-on-surface-variant">docs</span>
          </div>
          <div className="flex gap-2">
            <a href="/api/docs" className="rounded-full border border-md-border/30 px-4 py-1.5 text-xs text-md-on-surface-variant hover:bg-md-surface-variant/50 transition-colors">
              Raw Markdown
            </a>
            <a href="/" className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 text-xs font-medium active:scale-95 transition-transform">
              Home
            </a>
          </div>
        </div>
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      </div>
    </div>
  )
}
