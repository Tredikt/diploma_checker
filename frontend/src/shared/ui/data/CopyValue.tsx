import { useEffect, useRef, useState } from 'react'

import { copyToClipboard } from '@/shared/lib/clipboard'

interface CopyValueProps {
  value: string
  className?: string
  visibleValue?: string
  title?: string
  copyLabel?: string
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
      <path
        d="M9 9.75A2.25 2.25 0 0 1 11.25 7.5h7.5A2.25 2.25 0 0 1 21 9.75v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5A2.25 2.25 0 0 1 9 17.25v-7.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M15 7.5V6.75A2.25 2.25 0 0 0 12.75 4.5h-7.5A2.25 2.25 0 0 0 3 6.75v7.5a2.25 2.25 0 0 0 2.25 2.25H6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function CopyValue({ value, className, visibleValue, title, copyLabel = 'значение' }: CopyValueProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  async function handleCopy() {
    await copyToClipboard(value)
    setCopied(true)

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopied(false)
    }, 1600)
  }

  return (
    <div className={['relative inline-flex max-w-full', className ?? ''].join(' ')}>
      <div
        className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-[var(--line-subtle)] bg-white/78 px-3 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-soft)] transition"
        title={title ?? value}
      >
        <span className="min-w-0 truncate">{visibleValue ?? value}</span>
        <button
          aria-label={copied ? `${copyLabel} скопирован` : `Скопировать ${copyLabel}`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-transparent text-[var(--text-secondary)] transition hover:border-[var(--line-subtle)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-panel-strong)]"
          onClick={handleCopy}
          title={copied ? 'Скопировано' : 'Скопировать'}
          type="button"
        >
          <CopyIcon />
        </button>
      </div>
      <span
        aria-hidden={!copied}
        className={[
          'pointer-events-none absolute -top-3 right-2 rounded-full border border-[rgba(45,122,87,0.14)] bg-[rgba(45,122,87,0.94)] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_10px_26px_rgba(45,122,87,0.24)] transition-all duration-200',
          copied ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
        ].join(' ')}
      >
        Скопировано
      </span>
    </div>
  )
}
