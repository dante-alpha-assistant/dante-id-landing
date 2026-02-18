import { useState } from 'react'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 border border-[#333] rounded transition-colors shrink-0"
    >
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  )
}

function Section({ title, children, copyText }) {
  return (
    <div className="bg-white/5 border border-[#333] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase font-semibold">{title}</p>
        {copyText && <CopyButton text={copyText} />}
      </div>
      {children}
    </div>
  )
}

export default function PersonalBrandView({ content }) {
  if (!content) return null

  const tweets = content.twitter_thread || []
  const linkedin = content.linkedin_post || {}
  const ph = content.product_hunt || {}
  const bio = content.founder_bio || {}
  const pitch = content.elevator_pitch || {}

  const threadText = tweets.map((t, i) => `${i + 1}/ ${t.content}`).join('\n\n')
  const linkedinText = `${linkedin.headline || ''}\n\n${linkedin.body || ''}\n\n${(linkedin.hashtags || []).map(h => `#${h}`).join(' ')}`
  const phText = `${ph.tagline || ''}\n\n${ph.description || ''}\n\nMaker comment:\n${ph.maker_comment || ''}`

  return (
    <div className="space-y-4 pt-4">
      {/* Twitter Thread */}
      {tweets.length > 0 && (
        <Section title={`Twitter/X Thread (${tweets.length} tweets)`} copyText={threadText}>
          <div className="space-y-3">
            {tweets.map((t, i) => (
              <div key={i} className="flex gap-3">
                <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold">{t.tweet_number || i + 1}</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300 leading-relaxed">{t.content}</p>
                  {t.type && <span className="inline-block mt-1 text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded">{t.type}</span>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* LinkedIn */}
      {linkedin.body && (
        <Section title="LinkedIn Post" copyText={linkedinText}>
          {linkedin.headline && <p className="text-sm font-semibold text-white mb-2">{linkedin.headline}</p>}
          <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{linkedin.body}</p>
          {linkedin.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {linkedin.hashtags.map((h, i) => (
                <span key={i} className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">#{h}</span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Product Hunt */}
      {ph.tagline && (
        <Section title="Product Hunt" copyText={phText}>
          <p className="text-base font-semibold text-white mb-1">{ph.tagline}</p>
          <p className="text-sm text-gray-400 leading-relaxed mb-3">{ph.description}</p>
          {ph.maker_comment && (
            <div className="bg-white/5 rounded p-3 border-l-2 border-orange-500">
              <p className="text-xs text-gray-500 mb-1">Maker comment:</p>
              <p className="text-sm text-gray-300 italic">{ph.maker_comment}</p>
            </div>
          )}
          {ph.topics?.length > 0 && (
            <div className="flex gap-2 mt-3">
              {ph.topics.map((t, i) => (
                <span key={i} className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">{t}</span>
              ))}
            </div>
          )}
        </Section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Founder Bio */}
        {bio.short && (
          <Section title="Founder Bio" copyText={`${bio.short}\n\n${bio.long || ''}`}>
            <p className="text-sm text-white font-medium mb-2">{bio.short}</p>
            {bio.long && <p className="text-sm text-gray-400 leading-relaxed">{bio.long}</p>}
          </Section>
        )}

        {/* Elevator Pitch */}
        {pitch['30_seconds'] && (
          <Section title="Elevator Pitch" copyText={`30s: ${pitch['30_seconds']}\n\n60s: ${pitch['60_seconds'] || ''}`}>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">30 seconds</p>
                <p className="text-sm text-gray-300">{pitch['30_seconds']}</p>
              </div>
              {pitch['60_seconds'] && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">60 seconds</p>
                  <p className="text-sm text-gray-300">{pitch['60_seconds']}</p>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}
