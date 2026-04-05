import type { ReactNode } from 'react'

interface InlineConfirmCardProps {
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  isPending?: boolean
  footer?: ReactNode
}

export function InlineConfirmCard({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Отмена',
  onConfirm,
  onCancel,
  isPending = false,
  footer,
}: InlineConfirmCardProps) {
  return (
    <div className="rounded-[24px] border border-[rgba(178,79,67,0.16)] bg-[rgba(255,252,246,0.9)] p-5 shadow-[var(--shadow-soft)]">
      <div className="eyebrow text-[var(--danger)]">Подтверждение</div>
      <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="rounded-full bg-[var(--bg-ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--bg-ink-soft)] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending}
          onClick={onConfirm}
          type="button"
        >
          {isPending ? 'Выполняем...' : confirmLabel}
        </button>
        <button
          className="rounded-full border border-[var(--line-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/70"
          disabled={isPending}
          onClick={onCancel}
          type="button"
        >
          {cancelLabel}
        </button>
      </div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  )
}
