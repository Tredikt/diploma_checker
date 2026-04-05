import { cn } from '@/shared/lib/cn'
import type { UniversityDiplomaStatus } from '@/shared/types/university'

interface StatusBadgeProps {
  status: UniversityDiplomaStatus
}

const statusMeta: Record<UniversityDiplomaStatus, { label: string; className: string }> = {
  valid: {
    label: 'Действует',
    className: 'border-[rgba(45,122,87,0.22)] bg-[rgba(45,122,87,0.1)] text-[var(--success)]',
  },
  annulled: {
    label: 'Аннулирован',
    className: 'border-[rgba(178,79,67,0.22)] bg-[rgba(178,79,67,0.08)] text-[var(--danger)]',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = statusMeta[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
        meta.className,
      )}
    >
      {meta.label}
    </span>
  )
}
