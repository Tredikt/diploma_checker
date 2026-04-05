import type { CompanyVerificationResult } from '@/shared/types/company'
import { DefinitionGrid } from '@/shared/ui/data/DefinitionGrid'
import { VerificationStatusBadge } from '@/shared/ui/data/VerificationStatusBadge'
import { DataTableCard } from '@/shared/ui/data/DataTableCard'

interface VerificationResultPanelProps {
  result: CompanyVerificationResult
}

function formatTimestamp(value: string) {
  if (!value) {
    return 'Не указано'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function VerificationResultPanel({ result }: VerificationResultPanelProps) {
  return (
    <DataTableCard
      description="Полный набор данных доступен только авторизованной HR-команде."
      title="Результат проверки"
    >
      <DefinitionGrid
        items={[
          { label: 'Статус', value: <VerificationStatusBadge status={result.data.status} /> },
          { label: 'Сообщение', value: result.message },
          { label: 'ВУЗ', value: result.data.university_name },
          { label: 'ФИО', value: result.data.full_name },
          { label: 'Специальность', value: result.data.specialty },
          { label: 'Год выпуска', value: String(result.data.issue_year) },
          { label: 'Номер диплома', value: result.data.diploma_number },
          { label: 'Проверено', value: formatTimestamp(result.data.verification_timestamp) },
        ]}
      />
    </DataTableCard>
  )
}
