interface ErrorStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function ErrorState({ title, description, actionLabel, onAction }: ErrorStateProps) {
  return (
    <div className="shell-page flex min-h-screen items-center justify-center py-12">
      <div className="glass-panel w-full max-w-xl rounded-[32px] p-8">
        <div className="eyebrow text-[var(--danger)]">System Notice</div>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">{title}</h1>
        <p className="muted-copy mt-3">{description}</p>
        {actionLabel && onAction ? (
          <button
            className="mt-6 rounded-full bg-[var(--bg-ink)] px-5 py-3 text-sm font-semibold text-white"
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
