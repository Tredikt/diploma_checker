interface CompanyLimitCardProps {
  label: string
  value: string
  hint: string
  tone?: 'default' | 'accent'
}

export function CompanyLimitCard({ label, value, hint, tone = 'default' }: CompanyLimitCardProps) {
  return (
    <article
      className={[
        'rounded-[24px] border p-5 shadow-[var(--shadow-soft)]',
        tone === 'accent'
          ? 'border-[rgba(196,109,56,0.18)] bg-[var(--accent-soft)]'
          : 'border-[var(--line-subtle)] bg-white/56',
      ].join(' ')}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">{value}</div>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{hint}</p>
    </article>
  )
}
