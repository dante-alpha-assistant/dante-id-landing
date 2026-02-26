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
      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-md-secondary-container text-md-on-secondary-container hover:shadow-sm transition-all shrink-0"
    >
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  )
}

function Section({ title, children, copyText }) {
  return (
    <div className="bg-md-surface-container rounded-md-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-md-on-surface-variant uppercase font-semibold">{title}</p>
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
                <div className="shrink-0 w-6 h-6 rounded-full bg-md-primary-container text-md-on-primary-container text-xs flex items-center justify-center font-bold">{t.tweet_number || i + 1}</div>
                <div className="flex-1">
                  <p className="text-sm text-md-on-surface leading-relaxed">{t.content}</p>
                  {t.type && <span className="inline-block mt-1 rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs px-2 py-0.5">{t.type}</span>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* LinkedIn */}
      {linkedin.body && (
        <Section title="LinkedIn Post" copyText={linkedinText}>
          {linkedin.headline && <p className="text-sm font-semibold text-md-on-surface mb-2">{linkedin.headline}</p>}
          <p className="text-sm text-md-on-surface-variant leading-relaxed whitespace-pre-line">{linkedin.body}</p>
          {linkedin.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {linkedin.hashtags.map((h, i) => (
                <span key={i} className="rounded-full bg-md-primary-container text-md-on-primary-container text-xs px-2 py-0.5">#{h}</span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Product Hunt */}
      {ph.tagline && (
        <Section title="Product Hunt" copyText={phText}>
          <p className="text-base font-semibold text-md-on-surface mb-1">{ph.tagline}</p>
          <p className="text-sm text-md-on-surface-variant leading-relaxed mb-3">{ph.description}</p>
          {ph.maker_comment && (
            <div className="bg-md-tertiary-container rounded-md-lg p-3 border-l-2 border-md-tertiary">
              <p className="text-xs text-md-on-tertiary-container mb-1">Maker comment:</p>
              <p className="text-sm text-md-on-tertiary-container italic">{ph.maker_comment}</p>
            </div>
          )}
          {ph.topics?.length > 0 && (
            <div className="flex gap-2 mt-3">
              {ph.topics.map((t, i) => (
                <span key={i} className="rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs px-2 py-0.5">{t}</span>
              ))}
            </div>
          )}
        </Section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Founder Bio */}
        {bio.short && (
          <Section title="Founder Bio" copyText={`${bio.short}\n\n${bio.long || ''}`}>
            <p className="text-sm text-md-on-surface font-medium mb-2">{bio.short}</p>
            {bio.long && <p className="text-sm text-md-on-surface-variant leading-relaxed">{bio.long}</p>}
          </Section>
        )}

        {/* Elevator Pitch */}
        {pitch['30_seconds'] && (
          <Section title="Elevator Pitch" copyText={`30s: ${pitch['30_seconds']}\n\n60s: ${pitch['60_seconds'] || ''}`}>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-md-on-surface-variant mb-1">30 seconds</p>
                <p className="text-sm text-md-on-surface">{pitch['30_seconds']}</p>
              </div>
              {pitch['60_seconds'] && (
                <div>
                  <p className="text-xs text-md-on-surface-variant mb-1">60 seconds</p>
                  <p className="text-sm text-md-on-surface">{pitch['60_seconds']}</p>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}
