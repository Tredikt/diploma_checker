interface InlineMetricProps {
  label: string
  value: string
}

export function InlineMetric({ label, value }: InlineMetricProps) {
  return (
    <div className="rounded-[22px] border border-[var(--line-subtle)] bg-white/60 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-1.5 text-[1.7rem] font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  )
}
