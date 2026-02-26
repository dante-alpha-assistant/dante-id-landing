import { useState } from 'react'

export default function CopyButton({ text, label = 'Copy' }) {
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
      {copied ? '✓ Copied' : `📋 ${label}`}
    </button>
  )
}
