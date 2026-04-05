interface VerificationStatusBadgeProps {
  status: string
}

const verificationStatusMeta: Record<string, { label: string; className: string }> = {
  VALID: {
    label: 'Диплом подтверждён',
    className: 'border-[rgba(45,122,87,0.22)] bg-[rgba(45,122,87,0.1)] text-[var(--success)]',
  },
  INVALID: {
    label: 'Проверка не подтверждена',
    className: 'border-[rgba(178,79,67,0.22)] bg-[rgba(178,79,67,0.08)] text-[var(--danger)]',
  },
  REVOKED: {
    label: 'Диплом аннулирован',
    className: 'border-[rgba(178,79,67,0.22)] bg-[rgba(178,79,67,0.08)] text-[var(--danger)]',
  },
  EXPIRED: {
    label: 'Срок проверки истёк',
    className: 'border-[rgba(185,121,44,0.22)] bg-[rgba(185,121,44,0.1)] text-[var(--warning)]',
  },
}

export function VerificationStatusBadge({ status }: VerificationStatusBadgeProps) {
  const meta = verificationStatusMeta[status] ?? {
    label: status,
    className: 'border-[var(--line-subtle)] bg-white/70 text-[var(--text-secondary)]',
  }

  return (
    <span className={['inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]', meta.className].join(' ')}>
      {meta.label}
    </span>
  )
}
