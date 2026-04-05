import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getUniversityDiplomaDetail, revokeUniversityDiploma } from '@/features/university/api/university-api'
import { universityQueryKeys } from '@/features/university/model/university-query'
import { getApiErrorMessage } from '@/shared/api/http-client'
import { DataTableCard } from '@/shared/ui/data/DataTableCard'
import { DefinitionGrid } from '@/shared/ui/data/DefinitionGrid'
import { HashValue } from '@/shared/ui/data/HashValue'
import { StatusBadge } from '@/shared/ui/data/StatusBadge'
import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import { FormMessage } from '@/shared/ui/forms/FormMessage'
import { InlineConfirmCard } from '@/shared/ui/overlay/InlineConfirmCard'
import { LoadingState } from '@/shared/ui/states/LoadingState'

export function UniversityDiplomaDetailPage() {
  const { verificationHash } = useParams()
  const queryClient = useQueryClient()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const detailQuery = useQuery({
    queryKey: universityQueryKeys.detail(verificationHash ?? ''),
    queryFn: () => getUniversityDiplomaDetail(verificationHash ?? ''),
    enabled: Boolean(verificationHash),
  })

  const revokeMutation = useMutation({
    mutationFn: revokeUniversityDiploma,
    onSuccess: () => {
      setIsConfirmOpen(false)
      void queryClient.invalidateQueries({ queryKey: universityQueryKeys.all })
    },
  })

  if (!verificationHash) {
    return (
      <PageSection
        description="Для открытия карточки нужен корректный verification hash."
        title="Карточка недоступна"
      />
    )
  }

  if (detailQuery.isLoading) {
    return <LoadingState description="Получаем полные данные записи и её статус." title="Загружаем карточку" />
  }

  const diploma = detailQuery.data

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Diploma Detail"
        title="Карточка диплома"
        description="Данные записи и текущее состояние."
        aside={
          <InfoCard
            description="Полный hash доступен через копирование."
            label="Verification hash"
            title={<HashValue className="max-w-full" value={verificationHash} />}
          />
        }
      />

      {detailQuery.isError ? <FormMessage message={getApiErrorMessage(detailQuery.error, 'Не удалось загрузить карточку диплома.')} tone="error" /> : null}

      {diploma ? (
        <>
          <DataTableCard
            actions={
              <div className="flex flex-wrap gap-2.5">
                <Link className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/70" to="/app/university/registry">
                  Вернуться в реестр
                </Link>
                {diploma.status !== 'annulled' ? (
                  <button
                    className="rounded-full border border-[rgba(178,79,67,0.24)] px-4 py-2 text-sm font-semibold text-[var(--danger)] transition hover:bg-[rgba(178,79,67,0.06)]"
                    onClick={() => setIsConfirmOpen(true)}
                    type="button"
                  >
                    Аннулировать
                  </button>
                ) : null}
              </div>
            }
            description="Фактические данные записи."
            title="Данные диплома"
          >
            <DefinitionGrid
              items={[
                { label: 'Verification Hash', value: <HashValue className="max-w-full" value={diploma.verification_hash} /> },
                { label: 'Статус', value: <StatusBadge status={diploma.status} /> },
                { label: 'ФИО', value: diploma.full_name },
                { label: 'Год выпуска', value: diploma.graduation_year },
                { label: 'Специальность', value: diploma.specialty },
                { label: 'Номер диплома', value: diploma.diploma_number },
              ]}
            />
          </DataTableCard>

          {diploma.status === 'annulled' ? (
            <InfoCard description="Повторное действие недоступно." label="Статус действия" title="Аннулирование завершено" tone="warning" />
          ) : isConfirmOpen ? (
            <InlineConfirmCard
              confirmLabel="Аннулировать запись"
              description="После подтверждения запись перейдёт в read-only режим."
              footer={revokeMutation.isError ? <FormMessage message={getApiErrorMessage(revokeMutation.error, 'Не удалось аннулировать запись.')} tone="error" /> : null}
              isPending={revokeMutation.isPending}
              onCancel={() => setIsConfirmOpen(false)}
              onConfirm={() => revokeMutation.mutate(verificationHash)}
              title="Аннулирование диплома"
            />
          ) : null}
          {!isConfirmOpen && diploma.status !== 'annulled' ? (
            <InfoCard description="Аннулирование доступно из верхнего блока действий." label="Статус действия" title="Запись активна" />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
