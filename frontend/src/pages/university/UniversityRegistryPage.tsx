import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { getUniversityDiplomas, revokeUniversityDiploma } from '@/features/university/api/university-api'
import { universityQueryKeys } from '@/features/university/model/university-query'
import { getApiErrorMessage } from '@/shared/api/http-client'
import { DataTableCard } from '@/shared/ui/data/DataTableCard'
import { HashValue } from '@/shared/ui/data/HashValue'
import { InlineMetric } from '@/shared/ui/data/InlineMetric'
import { StatusBadge } from '@/shared/ui/data/StatusBadge'
import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import { FormMessage } from '@/shared/ui/forms/FormMessage'
import { InlineConfirmCard } from '@/shared/ui/overlay/InlineConfirmCard'
import { EmptyState } from '@/shared/ui/states/EmptyState'
import { LoadingState } from '@/shared/ui/states/LoadingState'

const PAGE_SIZE = 8

function OpenIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M13.5 5.25h5.25v5.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m10.5 13.5 8.25-8.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M18 13.5v4.125A1.875 1.875 0 0 1 16.125 19.5H6.375A1.875 1.875 0 0 1 4.5 17.625V7.875A1.875 1.875 0 0 1 6.375 6H10.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }

    return window.matchMedia('(max-width: 767px)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = () => {
      setIsMobile(mediaQuery.matches)
    }

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return isMobile
}

function RegistryCardActions({
  hash,
  status,
  onRevoke,
}: {
  hash: string
  status: 'valid' | 'annulled'
  onRevoke: () => void
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Link
        aria-label={`Открыть запись ${hash}`}
        className="inline-flex h-9 w-full items-center justify-center rounded-full border border-[var(--line-strong)] text-xs font-semibold text-[var(--text-primary)] transition hover:bg-white sm:h-10 sm:text-sm"
        to={`/app/university/diploma/${hash}`}
      >
        <span className="mr-1.5 inline-flex">
          <OpenIcon />
        </span>
        Открыть
      </Link>
      <button
        className="inline-flex h-9 w-full items-center justify-center rounded-full border border-[rgba(178,79,67,0.24)] px-3 text-xs font-semibold text-[var(--danger)] transition hover:bg-[rgba(178,79,67,0.06)] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:text-sm"
        disabled={status === 'annulled'}
        onClick={onRevoke}
        type="button"
      >
        {status === 'annulled' ? 'Аннулирован' : 'Аннулировать'}
      </button>
    </div>
  )
}

function RegistryMobileCard({
  item,
  onRevoke,
}: {
  item: {
    id: string
    verification_hash: string
    graduation_year: number
    status: 'valid' | 'annulled'
  }
  onRevoke: () => void
}) {
  return (
    <article className="rounded-[22px] border border-[var(--line-subtle)] bg-white/55 p-3.5 shadow-[var(--shadow-soft)]">
      <div className="space-y-2.5">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Verification hash</div>
          <HashValue className="mt-1.5 w-full" value={item.verification_hash} />
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-[16px] border border-[var(--line-subtle)] bg-[rgba(255,255,255,0.55)] p-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Год</div>
            <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{item.graduation_year}</div>
          </div>
          <div className="rounded-[16px] border border-[var(--line-subtle)] bg-[rgba(255,255,255,0.55)] p-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Статус</div>
            <div className="mt-1">
              <StatusBadge status={item.status} />
            </div>
          </div>
        </div>

        <RegistryCardActions hash={item.verification_hash} onRevoke={onRevoke} status={item.status} />
      </div>
    </article>
  )
}

export function UniversityRegistryPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [pendingRevokeHash, setPendingRevokeHash] = useState<string | null>(null)
  const isMobileViewport = useIsMobileViewport()
  const offset = Number(searchParams.get('offset') ?? '0')
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0

  const registryQuery = useQuery({
    queryKey: universityQueryKeys.list(PAGE_SIZE, safeOffset),
    queryFn: () => getUniversityDiplomas({ limit: PAGE_SIZE, offset: safeOffset }),
  })

  const revokeMutation = useMutation({
    mutationFn: revokeUniversityDiploma,
    onSuccess: () => {
      setPendingRevokeHash(null)
      void queryClient.invalidateQueries({ queryKey: universityQueryKeys.all })
    },
  })

  function setOffset(nextOffset: number) {
    setSearchParams(nextOffset > 0 ? { offset: String(nextOffset) } : {})
  }

  if (registryQuery.isLoading) {
    return <LoadingState description="Собираем реестр дипломов и статусы записей." title="Загружаем реестр" />
  }

  const isError = registryQuery.isError
  const data = registryQuery.data
  const items = data?.items ?? []
  const hasNextPage = data ? data.offset + data.limit < data.total : false

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="University Registry"
        title="Реестр дипломов"
        description="Список записей, статусов и действий."
        aside={
          <InfoCard
            description="Статусы обновляются после создания, импорта и аннулирования."
            label="Контур"
            title={data ? `${data.total} записей` : 'Реестр'}
            tone="accent"
          />
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InlineMetric label="Текущая выборка" value={String(items.length)} />
          <InlineMetric label="Всего записей" value={String(data?.total ?? items.length)} />
        </div>
      </PageSection>

      {pendingRevokeHash ? (
        <InlineConfirmCard
          confirmLabel="Аннулировать"
          description={`Запись ${pendingRevokeHash} будет переведена в статус «Аннулирован».`}
          isPending={revokeMutation.isPending}
          onCancel={() => setPendingRevokeHash(null)}
          onConfirm={() => revokeMutation.mutate(pendingRevokeHash)}
          title="Подтвердите аннулирование"
        />
      ) : null}

      <DataTableCard
        actions={
          <>
            <Link className="rounded-full border border-[var(--line-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-white/70 md:px-4 md:py-2.5 md:text-sm" to="/app/university/import">
              Импорт
            </Link>
            <Link
              className="rounded-full bg-[var(--bg-ink)] px-3 py-2 text-xs font-semibold !text-white transition hover:bg-[var(--bg-ink-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-panel)] md:px-4 md:py-2.5 md:text-sm"
              to="/app/university/create"
            >
              Создать запись
            </Link>
          </>
        }
        description="Рабочий список с быстрым доступом к карточке и статусным действиям."
        title="Список записей"
      >
        {isError ? (
          <FormMessage message={getApiErrorMessage(registryQuery.error, 'Не удалось загрузить реестр. Повторите запрос.')} tone="error" />
        ) : null}

        {!isError && items.length === 0 ? (
          <EmptyState
            description="Реестр пока пуст."
            hint="Добавьте запись вручную или загрузите файл."
            title="Записей пока нет"
          />
        ) : null}

        {!isError && items.length > 0 ? (
          <>
            {isMobileViewport ? (
              <div className="space-y-3 md:hidden">
                {items.map((item) => (
                  <RegistryMobileCard
                    item={item}
                    key={item.id}
                    onRevoke={() => setPendingRevokeHash(item.verification_hash)}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-[var(--line-subtle)]">
              <div className="overflow-x-auto overscroll-x-contain px-2 [-webkit-overflow-scrolling:touch] md:overflow-visible md:px-0">
                  <table className="min-w-[56rem] border-collapse md:min-w-full">
                <thead className="bg-[rgba(255,255,255,0.72)]">
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    <th className="whitespace-nowrap px-3 py-3 font-semibold md:px-5">Verification Hash</th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold md:px-5">Год</th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold md:px-5">Статус</th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold md:px-5">Действия</th>
                  </tr>
                </thead>
                    <tbody className="bg-white/40">
                  {items.map((item) => (
                      <tr className="border-t border-[var(--line-subtle)]" key={item.id}>
                      <td className="px-3 py-3 md:px-5">
                        <HashValue className="w-full max-w-[13rem] justify-between md:max-w-[19rem]" value={item.verification_hash} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-[var(--text-secondary)] md:px-5">{item.graduation_year}</td>
                      <td className="px-3 py-3 md:px-5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-3 py-3 md:px-5">
                        <div className="flex min-w-[8rem] flex-wrap items-center gap-2 md:justify-start">
                          <Link
                            aria-label={`Открыть запись ${item.verification_hash}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-strong)] text-[var(--text-primary)] transition hover:bg-white"
                            to={`/app/university/diploma/${item.verification_hash}`}
                            title="Открыть карточку"
                          >
                            <OpenIcon />
                          </Link>
                          <button
                            className="inline-flex h-10 items-center rounded-full border border-[rgba(178,79,67,0.24)] px-4 text-xs font-semibold text-[var(--danger)] transition hover:bg-[rgba(178,79,67,0.06)] disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={item.status === 'annulled'}
                            onClick={() => setPendingRevokeHash(item.verification_hash)}
                            type="button"
                          >
                            {item.status === 'annulled' ? 'Уже аннулирован' : 'Аннулировать'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-[var(--line-subtle)] bg-[rgba(255,255,255,0.65)] px-4 py-4 md:flex-row md:items-center md:justify-between">
              <p className="text-xs leading-5 text-[var(--text-secondary)] md:text-sm">
                Показаны записи {safeOffset + 1}-{safeOffset + items.length} из {data?.total ?? items.length}. Смещение {safeOffset}, страница {PAGE_SIZE}.
              </p>
              <div className="flex gap-2">
                <button
                  className="rounded-full border border-[var(--line-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40 md:px-4 md:text-sm"
                  disabled={safeOffset === 0}
                  onClick={() => setOffset(Math.max(0, safeOffset - PAGE_SIZE))}
                  type="button"
                >
                  Назад
                </button>
                <button
                  className="rounded-full bg-[var(--bg-ink)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--bg-ink-soft)] disabled:cursor-not-allowed disabled:opacity-40 md:px-4 md:text-sm"
                  disabled={!hasNextPage}
                  onClick={() => setOffset(safeOffset + PAGE_SIZE)}
                  type="button"
                >
                  Дальше
                </button>
              </div>
            </div>
          </>
        ) : null}
      </DataTableCard>
    </div>
  )
}
