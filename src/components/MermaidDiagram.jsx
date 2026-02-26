import { useEffect, useRef, useState } from 'react'

let mermaidLoaded = null
function loadMermaid() {
  if (mermaidLoaded) return mermaidLoaded
  mermaidLoaded = new Promise((resolve, reject) => {
    if (window.mermaid) { resolve(window.mermaid); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js'
    s.onload = () => {
      window.mermaid.initialize({
        startOnLoad: false, theme: 'neutral',
        themeVariables: {
          darkMode: false, background: '#fffbfe', primaryColor: '#e8def8',
          primaryTextColor: '#1d1b20', primaryBorderColor: '#cac4d0', lineColor: '#79747e',
          secondaryColor: '#f3edf7', tertiaryColor: '#ece6f0',
          fontFamily: 'system-ui, sans-serif', fontSize: '13px',
          nodeBorder: '#cac4d0', mainBkg: '#f3edf7', clusterBkg: '#fffbfe',
          clusterBorder: '#cac4d0', titleColor: '#1d1b20', edgeLabelBackground: '#fffbfe',
          nodeTextColor: '#1d1b20',
        },
      })
      resolve(window.mermaid)
    }
    s.onerror = reject
    document.head.appendChild(s)
  })
  return mermaidLoaded
}

let counter = 0

export default function MermaidDiagram({ code, title }) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(null)
  const [showCode, setShowCode] = useState(false)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!code) return
    loadMermaid().then(m => {
      const id = `mermaid-${++counter}`
      return m.render(id, code.trim())
    }).then(({ svg: rendered }) => {
      setSvg(rendered)
      setError(null)
    }).catch(err => {
      setError(err.message || 'Failed to render')
    })
  }, [code])

  const handleWheel = (e) => { e.preventDefault(); setScale(s => Math.max(0.25, Math.min(4, s * (e.deltaY > 0 ? 0.9 : 1.1)))) }
  const handleMouseDown = (e) => { setDragging(true); dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y } }
  const handleMouseMove = (e) => { if (dragging) setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }) }
  const handleMouseUp = () => setDragging(false)

  if (error) return (
    <div>
      <div className="text-[10px] text-md-error mb-2">Render error: {error}</div>
      <pre className="text-xs text-md-on-surface-variant bg-md-surface-variant p-4 rounded-md-lg overflow-x-auto whitespace-pre-wrap">{code}</pre>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setScale(s => Math.min(4, s * 1.2))} className="text-xs rounded-full bg-md-secondary-container text-md-on-secondary-container px-3 py-1 hover:shadow-sm transition-all">+</button>
        <button onClick={() => setScale(s => Math.max(0.25, s * 0.8))} className="text-xs rounded-full bg-md-secondary-container text-md-on-secondary-container px-3 py-1 hover:shadow-sm transition-all">−</button>
        <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }) }} className="text-xs rounded-full bg-md-secondary-container text-md-on-secondary-container px-3 py-1 hover:shadow-sm transition-all">Reset</button>
        <span className="text-xs text-md-on-surface-variant ml-2">{Math.round(scale * 100)}%</span>
        <div className="flex-1" />
        <button onClick={() => setShowCode(!showCode)} className="text-xs rounded-full bg-md-secondary-container text-md-on-secondary-container px-3 py-1 hover:shadow-sm transition-all">
          {showCode ? 'Hide Code' : 'View Code'}
        </button>
      </div>
      <div
        className="border border-md-outline-variant bg-md-surface rounded-md-lg overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ height: '400px', position: 'relative' }}
        onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      >
        <div
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: 'center center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      {showCode && <pre className="text-xs text-md-on-surface-variant bg-md-surface-variant p-4 rounded-md-lg overflow-x-auto whitespace-pre-wrap mt-2">{code}</pre>}
    </div>
  )
}
