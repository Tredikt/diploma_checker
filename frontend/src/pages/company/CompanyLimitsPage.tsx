import { useQuery } from '@tanstack/react-query'

import { getCompanyLimits } from '@/features/company/api/company-api'
import { companyQueryKeys } from '@/features/company/model/company-query'
import { getApiErrorMessage } from '@/shared/api/http-client'
import { CompanyLimitCard } from '@/shared/ui/data/CompanyLimitCard'
import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import { FormMessage } from '@/shared/ui/forms/FormMessage'
import { LoadingState } from '@/shared/ui/states/LoadingState'

function formatNumber(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value)
}

function formatDate(value: string) {
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

export function CompanyLimitsPage() {
  const limitsQuery = useQuery({
    queryKey: companyQueryKeys.limits,
    queryFn: getCompanyLimits,
  })

  if (limitsQuery.isLoading) {
    return <LoadingState description="Подготавливаем текущую квоту компании и данные использования." title="Загружаем лимиты" />
  }

  const data = limitsQuery.data
  const usagePercent = data?.quota_percentage_used ?? 0

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Company Limits"
        title="Лимиты компании"
        description="Квоты API и текущее использование в спокойном enterprise-формате без лишнего шума."
        aside={
          <InfoCard
            description="Обновление доступно вручную. При росте использования этот экран остаётся главным источником операционного статуса."
            footer={
              <button
                className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={limitsQuery.isFetching}
                onClick={() => {
                  void limitsQuery.refetch()
                }}
                type="button"
              >
                {limitsQuery.isFetching ? 'Обновляем...' : 'Обновить'}
              </button>
            }
            label="Квота"
            title={data ? `${usagePercent.toFixed(1)}% использовано` : 'Лимиты'}
            tone="accent"
          />
        }
      />

      {limitsQuery.isError ? <FormMessage message={getApiErrorMessage(limitsQuery.error, 'Не удалось загрузить лимиты компании.')} tone="error" /> : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <CompanyLimitCard hint="Общий объём запросов на текущий расчётный период." label="Месячная квота" tone="accent" value={formatNumber(data.monthly_quota)} />
            <CompanyLimitCard hint="Количество запросов, уже использованных компанией." label="Использовано" value={formatNumber(data.current_month_usage)} />
            <CompanyLimitCard
              hint="Доступный остаток лимитов использования."
              label="Процент использования"
              value={`${usagePercent.toFixed(1)}%`}
            />
          </div>

          <section className="glass-panel rounded-[28px] p-5 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="eyebrow">Usage Progress</div>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Текущее использование</h2>
              </div>
              <div className="text-sm text-[var(--text-secondary)]">Последнее обновление лимитов: {formatDate(data.last_reset_date)}</div>
            </div>

            <div className="mt-6 rounded-full bg-[rgba(23,33,31,0.08)] p-1">
              <div
                aria-label={`Использовано ${usagePercent.toFixed(0)} процентов`}
                className="h-4 rounded-full bg-[linear-gradient(90deg,var(--accent)_0%,#d49267_100%)] transition-[width]"
                style={{ width: `${data.current_month_usage > 0 ? Math.max(usagePercent, 6) : 0}%` }}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-[18px] border border-[var(--line-subtle)] bg-white/52 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Процент использования</div>
                <div className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{usagePercent.toFixed(1)}%</div>
              </div>
              <div className="rounded-[18px] border border-[var(--line-subtle)] bg-white/52 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Следующее действие</div>
                <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  При приближении к лимиту откройте раздел API-ключей и проверьте, какие интеграции действительно используют квоту.
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
