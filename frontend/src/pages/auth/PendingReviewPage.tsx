import { Link, useLocation } from 'react-router-dom'

import { roleLabels, rolePendingDescriptions } from '@/features/auth/model/auth-config'
import type { UserRole } from '@/shared/types/auth'
import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'

export function PendingReviewPage() {
  const location = useLocation()
  const state = location.state as { role?: UserRole } | null
  const role = state?.role === 'company' ? 'company' : 'university'

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Review In Progress"
        title="Заявка ожидает подтверждения"
        description={rolePendingDescriptions[role]}
        aside={
          <InfoCard
            label="Статус"
            title={`Проверка: ${roleLabels[role]}`}
            description="Доступ к кабинету откроется после подтверждения организации."
            tone="warning"
          />
        }
      >
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-full bg-[var(--bg-ink)] px-5 py-3 text-sm font-semibold text-white" to="/auth/login">
            Вернуться ко входу
          </Link>
          <Link className="rounded-full border border-[var(--line-strong)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-white/70" to={`/auth/register/${role}`}>
            Подать заявку заново
          </Link>
        </div>
      </PageSection>
    </div>
  )
}
