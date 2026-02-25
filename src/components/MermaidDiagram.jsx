import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#0a0a0a',
    primaryColor: '#1f521f',
    primaryTextColor: '#33ff00',
    primaryBorderColor: '#33ff00',
    lineColor: '#22aa00',
    secondaryColor: '#0f0f0f',
    tertiaryColor: '#050505',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '12px',
    nodeBorder: '#33ff00',
    mainBkg: '#0f0f0f',
    clusterBkg: '#0a0a0a',
    clusterBorder: '#1f521f',
    titleColor: '#33ff00',
    edgeLabelBackground: '#0a0a0a',
    nodeTextColor: '#33ff00',
  },
})

let counter = 0

export default function MermaidDiagram({ code, title }) {
  const containerRef = useRef(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(null)
  const [showCode, setShowCode] = useState(false)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!code) return
    const id = `mermaid-${++counter}`
    mermaid.render(id, code.trim())
      .then(({ svg: rendered }) => {
        setSvg(rendered)
        setError(null)
      })
      .catch(err => {
        console.error('Mermaid render error:', err)
        setError(err.message || 'Failed to render diagram')
      })
  }, [code])

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(s => Math.max(0.25, Math.min(4, s * delta)))
  }

  const handleMouseDown = (e) => {
    setDragging(true)
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }

  const handleMouseMove = (e) => {
    if (!dragging) return
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
  }

  const handleMouseUp = () => setDragging(false)

  const resetView = () => { setScale(1); setPan({ x: 0, y: 0 }) }

  if (error) {
    return (
      <div>
        <div className="text-[10px] text-red-400 mb-2">Render error: {error}</div>
        <pre className="text-xs text-[#22aa00] bg-[#050505] p-4 border border-[#1f521f] overflow-x-auto whitespace-pre-wrap">{code}</pre>
      </div>
    )
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setScale(s => Math.min(4, s * 1.2))} className="text-[10px] border border-[#1f521f] px-2 py-0.5 text-[#22aa00] hover:border-[#33ff00]">[ + ]</button>
        <button onClick={() => setScale(s => Math.max(0.25, s * 0.8))} className="text-[10px] border border-[#1f521f] px-2 py-0.5 text-[#22aa00] hover:border-[#33ff00]">[ - ]</button>
        <button onClick={resetView} className="text-[10px] border border-[#1f521f] px-2 py-0.5 text-[#22aa00] hover:border-[#33ff00]">[ RESET ]</button>
        <span className="text-[10px] text-[#1a6b1a] ml-2">{Math.round(scale * 100)}%</span>
        <div className="flex-1" />
        <button onClick={() => setShowCode(!showCode)} className="text-[10px] border border-[#1f521f] px-2 py-0.5 text-[#1a6b1a] hover:border-[#33ff00] hover:text-[#33ff00]">
          {showCode ? '[ HIDE CODE ]' : '[ VIEW CODE ]'}
        </button>
      </div>

      {/* Diagram viewport */}
      <div
        ref={containerRef}
        className="border border-[#1f521f] bg-[#050505] overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ height: '400px', position: 'relative' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/* Collapsible raw code */}
      {showCode && (
        <pre className="text-xs text-[#22aa00] bg-[#050505] p-4 border border-[#1f521f] overflow-x-auto whitespace-pre-wrap mt-2">{code}</pre>
      )}
    </div>
  )
}
