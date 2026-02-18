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
      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 border border-[#333] rounded transition-colors shrink-0"
    >
      {copied ? '✓ Copied' : `📋 ${label}`}
    </button>
  )
}
