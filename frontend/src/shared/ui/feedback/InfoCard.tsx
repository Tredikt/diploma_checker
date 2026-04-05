import type { ReactNode } from 'react'

interface InfoCardProps {
  label: string
  title: ReactNode
  description: string
  tone?: 'default' | 'accent' | 'warning'
  footer?: ReactNode
}

const toneClasses = {
  default: 'bg-[rgba(255,255,255,0.56)]',
  accent: 'bg-[var(--accent-soft)]',
  warning: 'bg-[rgba(185,121,44,0.14)]',
}

export function InfoCard({ label, title, description, tone = 'default', footer }: InfoCardProps) {
  return (
    <article
      className={`rounded-[24px] border border-[var(--line-subtle)] p-4 shadow-[var(--shadow-soft)] ${toneClasses[tone]}`}
    >
      <div className="eyebrow">{label}</div>
      <h2 className="mt-2.5 text-[1.55rem] font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </article>
  )
}
