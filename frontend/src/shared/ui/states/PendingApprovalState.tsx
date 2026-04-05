import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'

export function PendingApprovalState() {
  return (
    <div className="shell-page py-8 md:py-10">
      <PageSection
        eyebrow="Статус"
        title="Заявка ожидает подтверждения"
        description="Для организаций и компаний доступ к кабинету активируется после ручной проверки администратором."
        aside={
          <InfoCard
            label="Проверка"
            title="Ожидание подтверждения"
            description="После подтверждения доступ к кабинету откроется автоматически."
            tone="accent"
          />
        }
      />
    </div>
  )
}
