import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { getStudentDiplomas } from '@/features/student/api/student-api'
import { studentQueryKeys } from '@/features/student/model/student-query'
import { getApiErrorMessage } from '@/shared/api/http-client'
import type { StudentDiplomaListItem } from '@/shared/types/student'
import { DataTableCard } from '@/shared/ui/data/DataTableCard'
import { HashValue } from '@/shared/ui/data/HashValue'
import { InlineMetric } from '@/shared/ui/data/InlineMetric'
import { StatusBadge } from '@/shared/ui/data/StatusBadge'
import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import { FormMessage } from '@/shared/ui/forms/FormMessage'
import { EmptyState } from '@/shared/ui/states/EmptyState'
import { LoadingState } from '@/shared/ui/states/LoadingState'

const PAGE_SIZE = 8

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

function StudentDiplomaMobileCard({ item }: { item: StudentDiplomaListItem }) {
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

        <Link
          className="inline-flex h-10 w-full items-center justify-center rounded-full border border-[var(--line-strong)] text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white"
          to={`/app/student/diplomas/${item.id}`}
        >
          Открыть
        </Link>
      </div>
    </article>
  )
}

export function StudentDiplomaListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const isMobileViewport = useIsMobileViewport()
  const offset = Number(searchParams.get('offset') ?? '0')
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0

  const diplomasQuery = useQuery({
    queryKey: studentQueryKeys.list(PAGE_SIZE, safeOffset),
    queryFn: () => getStudentDiplomas({ limit: PAGE_SIZE, offset: safeOffset }),
  })

  function setOffset(nextOffset: number) {
    setSearchParams(nextOffset > 0 ? { offset: String(nextOffset) } : {})
  }

  if (diplomasQuery.isLoading) {
    return <LoadingState description="Подготавливаем список дипломов и их текущие статусы." title="Загружаем дипломы" />
  }

  const data = diplomasQuery.data
  const items = data?.items ?? []
  const hasNextPage = data ? data.offset + data.limit < data.total : false

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Student Diplomas"
        title="Мои дипломы"
        description="Список дипломов, привязанных к вашему аккаунту. Откройте запись, чтобы проверить детали и подготовиться к следующему этапу шаринга."
        aside={
          <InfoCard
            description="Статусы и данные подтягиваются напрямую из student API без промежуточных заглушек."
            label="Контур"
            title={data ? `${data.total} записей` : 'Дипломы'}
            tone="accent"
          />
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InlineMetric label="Текущая выборка" value={String(items.length)} />
          <InlineMetric label="Всего дипломов" value={String(data?.total ?? items.length)} />
        </div>
      </PageSection>

      <DataTableCard description="Рабочий список с быстрым переходом в деталь. На mobile используется тот же набор данных в более компактной подаче." title="Реестр студента">
        {diplomasQuery.isError ? (
          <FormMessage message={getApiErrorMessage(diplomasQuery.error, 'Не удалось загрузить дипломы. Повторите запрос.')} tone="error" />
        ) : null}

        {!diplomasQuery.isError && items.length === 0 ? (
          <EmptyState
            description="У этого аккаунта пока нет доступных дипломов."
            hint="Если запись должна быть видна уже сейчас, проверьте связку аккаунта и реестра в ВУЗе."
            title="Дипломы не найдены"
          />
        ) : null}

        {!diplomasQuery.isError && items.length > 0 ? (
          <>
            {isMobileViewport ? (
              <div className="space-y-3 md:hidden">
                {items.map((item) => (
                  <StudentDiplomaMobileCard item={item} key={item.id} />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-[var(--line-subtle)]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--line-subtle)] text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        <th className="px-4 py-3">Verification hash</th>
                        <th className="px-4 py-3">Год</th>
                        <th className="px-4 py-3">Статус</th>
                        <th className="px-4 py-3">Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr className="border-b border-[var(--line-subtle)] last:border-b-0" key={item.id}>
                          <td className="px-4 py-4 align-middle">
                            <HashValue value={item.verification_hash} />
                          </td>
                          <td className="px-4 py-4 align-middle text-sm font-semibold text-[var(--text-primary)]">{item.graduation_year}</td>
                          <td className="px-4 py-4 align-middle">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <Link
                              className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--line-strong)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white"
                              to={`/app/student/diplomas/${item.id}`}
                            >
                              Открыть
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 rounded-[24px] border border-[var(--line-subtle)] bg-white/50 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-[var(--text-secondary)]">
                Показаны дипломы {data ? data.offset + 1 : 0}-{data ? data.offset + items.length : items.length} из {data?.total ?? items.length}
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={safeOffset === 0}
                  onClick={() => setOffset(Math.max(safeOffset - PAGE_SIZE, 0))}
                  type="button"
                >
                  Назад
                </button>
                <button
                  className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
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
