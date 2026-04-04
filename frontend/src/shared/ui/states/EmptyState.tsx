interface EmptyStateProps {
  title: string
  description: string
  hint?: string
}

export function EmptyState({ title, description, hint }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-[var(--line-strong)] bg-[rgba(255,255,255,0.4)] p-6">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="muted-copy mt-2">{description}</p>
      {hint ? <p className="mt-4 text-sm text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  )
}
