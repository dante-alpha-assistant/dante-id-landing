import { useState } from 'react'
import CopyButton from './CopyButton'

const slideTypes = {
  title: { icon: '🎯', label: 'Title' },
  problem: { icon: '😤', label: 'Problem' },
  solution: { icon: '💡', label: 'Solution' },
  market: { icon: '📈', label: 'Market' },
  product: { icon: '🛠️', label: 'Product' },
  traction: { icon: '📊', label: 'Traction' },
  business_model: { icon: '💰', label: 'Business Model' },
  competition: { icon: '🥊', label: 'Competition' },
  team: { icon: '👥', label: 'Team' },
  ask: { icon: '🤝', label: 'The Ask' },
}

export default function PitchDeckView({ content }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showNotes, setShowNotes] = useState(false)
  
  if (!content || !content.slides) return null
  
  const slides = content.slides
  const current = slides[currentSlide]
  const typeInfo = slideTypes[current?.type] || { icon: '📄', label: 'Slide' }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">{currentSlide + 1} / {slides.length}</span>
        <CopyButton text={JSON.stringify(content, null, 2)} label="Copy All" />
      </div>

      {/* Slide Viewer */}
      <div className="bg-[#0a0a0a] border border-[#333] rounded-xl overflow-hidden">
        {/* Slide Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222] bg-[#111]">
          <div className="flex items-center gap-2">
            <span className="text-lg">{typeInfo.icon}</span>
            <span className="text-sm font-medium text-gray-300">{typeInfo.label}</span>
          </div>
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentSlide ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Slide Content */}
        <div className="p-6 min-h-[280px]">
          <h3 className="text-xl font-semibold text-white mb-4">{current?.title}</h3>
          
          {current?.bullets && (
            <ul className="space-y-3">
              {current.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-sm leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {current?.visual_suggestion && (
            <div className="mt-6 p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
              <span className="text-xs text-gray-500 uppercase">Visual Suggestion</span>
              <p className="text-sm text-gray-400 mt-1">{current.visual_suggestion}</p>
            </div>
          )}
        </div>

        {/* Speaker Notes */}
        {showNotes && current?.speaker_notes && (
          <div className="px-6 pb-6">
            <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
              <span className="text-xs text-blue-400 uppercase font-medium">Speaker Notes</span>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">{current.speaker_notes}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#222] bg-[#111]">
          <button
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              showNotes ? 'bg-blue-900/50 text-blue-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {showNotes ? 'Hide Notes' : 'Show Notes'}
          </button>
          
          <button
            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Slide Overview */}
      <div className="grid grid-cols-5 gap-2">
        {slides.map((slide, i) => {
          const info = slideTypes[slide.type] || { icon: '📄' }
          return (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`p-2 rounded-lg border text-center transition-all ${
                i === currentSlide 
                  ? 'bg-blue-900/30 border-blue-700' 
                  : 'bg-[#111] border-[#222] hover:border-[#333]'
              }`}
            >
              <span className="text-lg">{info.icon}</span>
              <span className="block text-[10px] text-gray-500 mt-1">{i + 1}</span>
            </button>
          )
        })}
      </div>

      {content.narrative_arc && (
        <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
          <span className="text-xs text-gray-500 uppercase">Narrative Arc</span>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">{content.narrative_arc}</p>
        </div>
      )}
    </div>
  )
}
