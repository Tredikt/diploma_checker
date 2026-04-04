import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'

interface ComingSoonStateProps {
  area: string
  description: string
}

export function ComingSoonState({ area, description }: ComingSoonStateProps) {
  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Раздел"
        title={area}
        description={description}
        aside={
          <InfoCard
            label="Статус"
            title="Раздел готовится"
            description="Экран доступен в навигации, содержимое появится в следующем обновлении."
            tone="warning"
          />
        }
      />
    </div>
  )
}
