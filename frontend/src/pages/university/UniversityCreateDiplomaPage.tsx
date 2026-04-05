import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { createUniversityDiploma } from '@/features/university/api/university-api'
import { createUniversityDiplomaSchema, type CreateUniversityDiplomaFormValues } from '@/features/university/model/university-forms'
import { universityQueryKeys } from '@/features/university/model/university-query'
import { getApiErrorMessage } from '@/shared/api/http-client'
import { DefinitionGrid } from '@/shared/ui/data/DefinitionGrid'
import { DataTableCard } from '@/shared/ui/data/DataTableCard'
import { HashValue } from '@/shared/ui/data/HashValue'
import { StatusBadge } from '@/shared/ui/data/StatusBadge'
import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import { FormField } from '@/shared/ui/forms/FormField'
import { FormMessage } from '@/shared/ui/forms/FormMessage'

export function UniversityCreateDiplomaPage() {
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<CreateUniversityDiplomaFormValues>({
    resolver: zodResolver(createUniversityDiplomaSchema),
    defaultValues: {
      full_name: '',
      year: new Date().getFullYear(),
      specialty: '',
      diploma_number: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: createUniversityDiploma,
    onSuccess: () => {
      setFormError(null)
      void queryClient.invalidateQueries({ queryKey: universityQueryKeys.all })
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, 'Не удалось создать запись. Проверьте поля формы и повторите попытку.'))
    },
  })

  const handleSubmit = form.handleSubmit((values) => {
    setFormError(null)
    createMutation.mutate(values)
  })

  function handleCreateAnother() {
    createMutation.reset()
    setFormError(null)
    form.reset({
      full_name: '',
      year: new Date().getFullYear(),
      specialty: '',
      diploma_number: '',
    })
  }

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Create Diploma"
        title="Создание записи"
        description="Ручное добавление одной записи."
        aside={<InfoCard description="После создания запись сразу доступна в карточке и реестре." label="Результат" title="Готово к публикации" tone="accent" />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DataTableCard description="Только обязательные поля записи." title="Параметры диплома">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField error={form.formState.errors.full_name?.message} label="ФИО" placeholder="Иван Петров" {...form.register('full_name')} />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField error={form.formState.errors.year?.message} label="Год выпуска" placeholder="2024" type="number" {...form.register('year')} />
              <FormField error={form.formState.errors.diploma_number?.message} label="Номер диплома" placeholder="ABC-12345" {...form.register('diploma_number')} />
            </div>
            <FormField error={form.formState.errors.specialty?.message} label="Специальность" placeholder="Прикладная информатика" {...form.register('specialty')} />

            {formError ? <FormMessage message={formError} tone="error" /> : null}

            <button
              className="w-full rounded-full bg-[var(--bg-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--bg-ink-soft)] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={createMutation.isPending}
              type="submit"
            >
              {createMutation.isPending ? 'Создаём запись...' : 'Создать запись'}
            </button>
          </form>
        </DataTableCard>

        <DataTableCard description="Статус создания и быстрые действия." title="Итог">
          {createMutation.data ? (
            <div className="space-y-5">
              <FormMessage message="Запись создана." tone="success" />
              <DefinitionGrid
                items={[
                  { label: 'ID', value: <HashValue className="max-w-full" value={createMutation.data.id} /> },
                  { label: 'Verification Hash', value: <HashValue className="max-w-full" value={createMutation.data.verification_hash} /> },
                  { label: 'Статус', value: <StatusBadge status={createMutation.data.status} /> },
                ]}
              />
              <div className="flex flex-wrap gap-2.5">
                <Link
                  className="rounded-full bg-[var(--bg-ink)] px-4 py-2 text-sm font-semibold !text-white transition hover:bg-[var(--bg-ink-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-panel)]"
                  to={`/app/university/diploma/${createMutation.data.verification_hash}`}
                >
                  Открыть карточку
                </Link>
                <button
                  className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/70"
                  onClick={handleCreateAnother}
                  type="button"
                >
                  Создать ещё
                </button>
              </div>
            </div>
          ) : (
            <InfoCard description="После отправки формы здесь появится hash и действия." label="Статус" title="Ожидает создания" />
          )}
        </DataTableCard>
      </div>
    </div>
  )
}
