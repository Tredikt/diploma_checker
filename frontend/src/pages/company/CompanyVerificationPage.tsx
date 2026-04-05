import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { searchCompanyDiploma } from '@/features/company/api/company-api'
import { companyVerificationSearchSchema, type CompanyVerificationSearchFormValues } from '@/features/company/model/company-forms'
import type { CompanyVerificationSearchPayload } from '@/shared/types/company'
import type { CompanyVerificationResult } from '@/shared/types/company'
import { ApiError, getApiErrorMessage } from '@/shared/api/http-client'
import { VerificationResultPanel } from '@/shared/ui/data/VerificationResultPanel'
import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import { ResultBanner } from '@/shared/ui/feedback/ResultBanner'
import { FormField } from '@/shared/ui/forms/FormField'
import { FormMessage } from '@/shared/ui/forms/FormMessage'
import { EmptyState } from '@/shared/ui/states/EmptyState'

const KNOWN_ERROR_TITLES: Record<number, { title: string; description: string }> = {
  404: {
    title: 'Диплом не найден',
    description: 'Проверьте номер диплома и код ВУЗа. Для новой попытки достаточно скорректировать поля и повторить поиск.',
  },
  422: {
    title: 'Проверьте формат запроса',
    description: 'Один из параметров заполнен в неверном формате. Исправьте поля и отправьте форму ещё раз.',
  },
  429: {
    title: 'Лимит проверок достигнут',
    description: 'Квота компании временно исчерпана. Откройте раздел лимитов, чтобы уточнить доступный объём.',
  },
}

function SearchHistory({
  item,
  onReuse,
}: {
  item: { request: CompanyVerificationSearchPayload; result: CompanyVerificationResult } | null
  onReuse: () => void
}) {
  if (!item) {
    return (
      <InfoCard
        description="История появится после первой успешной ручной проверки в текущей сессии."
        label="История"
        title="Повторных проверок пока нет"
      />
    )
  }

  return (
    <div className="rounded-[24px] border border-[var(--line-subtle)] bg-white/56 p-4 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Последняя успешная проверка</div>
          <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{item.result.data.full_name}</div>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            {item.result.data.university_name} · {item.result.data.diploma_number}
          </p>
        </div>
        <button
          className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/70"
          onClick={onReuse}
          type="button"
        >
          Повторить поля
        </button>
      </div>
    </div>
  )
}

export function CompanyVerificationPage() {
  const [lastSuccess, setLastSuccess] = useState<{ request: CompanyVerificationSearchPayload; result: CompanyVerificationResult } | null>(null)

  const form = useForm<CompanyVerificationSearchFormValues>({
    resolver: zodResolver(companyVerificationSearchSchema),
    defaultValues: {
      university_code: '',
      diploma_number: '',
    },
  })

  const searchMutation = useMutation({
    mutationFn: searchCompanyDiploma,
    onSuccess: (result, variables) => {
      setLastSuccess({
        request: variables,
        result,
      })
    },
  })

  const handleSubmit = form.handleSubmit((values) => {
    searchMutation.mutate(values)
  })

  const errorMeta =
    searchMutation.error instanceof ApiError ? KNOWN_ERROR_TITLES[searchMutation.error.status] : null

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="HR Verification"
        title="Ручная проверка"
        description="Поиск диплома по номеру и коду ВУЗа. Экран оптимизирован под быстрые повторные проверки и мобильный сценарий."
        aside={
          <InfoCard
            description="После подтверждения компании здесь доступен полный результат проверки без публичных ограничений."
            label="Доступ"
            title="Внутренний HR-контур"
            tone="accent"
            footer={
              <div className="flex flex-wrap gap-2">
                <Link className="text-sm font-semibold text-[var(--accent)]" to="/app/company/api-keys">
                  API-ключи
                </Link>
                <Link className="text-sm font-semibold text-[var(--accent)]" to="/app/company/limits">
                  Лимиты
                </Link>
              </div>
            }
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="glass-panel rounded-[28px] p-5 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="eyebrow">Verification Search</div>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Параметры поиска</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Введите код ВУЗа и номер диплома. Уже введённые значения остаются в форме после ошибки или успешной проверки.
                </p>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <FormField
                adornment="Код"
                error={form.formState.errors.university_code?.message}
                label="Код ВУЗа"
                placeholder="MGU-01"
                {...form.register('university_code')}
              />
              <FormField
                adornment="№"
                error={form.formState.errors.diploma_number?.message}
                label="Номер диплома"
                placeholder="ABC-12345"
                {...form.register('diploma_number')}
              />

              {searchMutation.isError ? (
                <FormMessage
                  message={getApiErrorMessage(searchMutation.error, 'Не удалось выполнить проверку. Повторите запрос.')}
                  tone="error"
                />
              ) : null}

              <button
                className="w-full rounded-full bg-[var(--bg-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--bg-ink-soft)] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={searchMutation.isPending}
                type="submit"
              >
                {searchMutation.isPending ? 'Проверяем диплом...' : 'Проверить диплом'}
              </button>
            </form>
          </section>

          <SearchHistory
            item={lastSuccess}
            onReuse={() => {
              if (!lastSuccess) {
                return
              }

              form.setValue('university_code', lastSuccess.request.university_code)
              form.setValue('diploma_number', lastSuccess.request.diploma_number)
            }}
          />
        </div>

        <div className="space-y-6">
          <ResultBanner
            description="Для автоматизации внутренних систем используйте API-ключи компании. Ручная проверка и API работают в одном квотном контуре."
            title="API и ручной сценарий используют общий источник данных"
          />

          {searchMutation.isSuccess ? <VerificationResultPanel result={searchMutation.data} /> : null}

          {searchMutation.isError && errorMeta ? (
            <EmptyState description={errorMeta.description} title={errorMeta.title} />
          ) : null}

          {!searchMutation.isPending && !searchMutation.isSuccess && !searchMutation.isError ? (
            <EmptyState
              description="Результат проверки появится здесь сразу после отправки формы."
              hint="Экран показывает полный набор доступных HR-данных и не требует перехода на отдельную карточку."
              title="Ожидает проверку"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
