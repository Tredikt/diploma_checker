import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { getStudentDiplomaDetail } from '@/features/student/api/student-api'
import { studentQueryKeys } from '@/features/student/model/student-query'
import { ApiError, getApiErrorMessage } from '@/shared/api/http-client'
import { DefinitionGrid } from '@/shared/ui/data/DefinitionGrid'
import { HashValue } from '@/shared/ui/data/HashValue'
import { StatusBadge } from '@/shared/ui/data/StatusBadge'
import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import { ResultBanner } from '@/shared/ui/feedback/ResultBanner'
import { EmptyState } from '@/shared/ui/states/EmptyState'
import { LoadingState } from '@/shared/ui/states/LoadingState'

const KNOWN_DETAIL_STATE: Record<number, { title: string; description: string }> = {
  404: {
    title: 'Диплом не найден',
    description: 'Запись не найдена или больше недоступна для этого аккаунта.',
  },
  422: {
    title: 'Некорректный идентификатор',
    description: 'Ссылка на диплом повреждена или имеет неверный формат.',
  },
}

export function StudentDiplomaDetailPage() {
  const { diplomaId } = useParams()

  const diplomaQuery = useQuery({
    queryKey: studentQueryKeys.detail(diplomaId ?? ''),
    queryFn: () => getStudentDiplomaDetail(diplomaId ?? ''),
    enabled: Boolean(diplomaId),
  })

  if (!diplomaId) {
    return <EmptyState description="Маршрут не содержит идентификатор диплома." title="Не удалось открыть запись" />
  }

  if (diplomaQuery.isLoading) {
    return <LoadingState description="Подготавливаем карточку диплома и связанные статусы." title="Загружаем запись" />
  }

  if (diplomaQuery.isError) {
    const meta = diplomaQuery.error instanceof ApiError ? KNOWN_DETAIL_STATE[diplomaQuery.error.status] : null

    return (
      <div className="space-y-6">
        <PageSection
          eyebrow="Student Diploma"
          title="Деталь диплома"
          description="Экран показывает полную запись диплома и остаётся центральной точкой для следующего этапа student-функций."
          aside={
            <InfoCard
              description="После восстановления доступа или исправления ссылки можно вернуться в список и повторить переход."
              label="Навигация"
              title="Рабочий маршрут"
            />
          }
        />

        <EmptyState
          description={meta?.description ?? getApiErrorMessage(diplomaQuery.error, 'Не удалось загрузить карточку диплома.')}
          hint="Вернитесь к списку дипломов и повторите переход."
          title={meta?.title ?? 'Ошибка загрузки'}
        />

        <div>
          <Link className="text-sm font-semibold text-[var(--accent)]" to="/app/student/diplomas">
            Вернуться к списку
          </Link>
        </div>
      </div>
    )
  }

  const diploma = diplomaQuery.data

  if (!diploma) {
    return <EmptyState description="Данные диплома временно недоступны." title="Запись не загружена" />
  }

  const isAnnulled = diploma.status === 'annulled'

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Student Diploma"
        title="Деталь диплома"
        description="Полная запись диплома с текущим статусом и идентификаторами для последующего управления доступом."
        aside={
          <InfoCard
            description={isAnnulled ? 'Запись аннулирована и доступна только для просмотра.' : 'Из этой карточки можно перейти к выпуску ссылок, QR и управлению доступом.'}
            label="Статус"
            title={isAnnulled ? 'Read-only режим' : 'Шаринг доступен'}
            tone={isAnnulled ? 'default' : 'accent'}
          />
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={diploma.status} />
          <Link className="text-sm font-semibold text-[var(--accent)]" to="/app/student/diplomas">
            Вернуться к списку
          </Link>
          {!isAnnulled ? (
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--bg-ink)] px-4 text-sm font-semibold !text-white transition hover:bg-[var(--bg-ink-soft)]"
              to={`/app/student/diplomas/${diploma.id}/access`}
            >
              Управление доступом
            </Link>
          ) : null}
        </div>
      </PageSection>

      {isAnnulled ? (
        <ResultBanner
          description="Диплом аннулирован на стороне реестра. Карточка остаётся доступной для просмотра, но дальнейшие действия по доступу не предлагаются."
          title="Запись доступна только для чтения"
          tone="warning"
        />
      ) : (
        <ResultBanner
          description="Выпускайте access tokens, открывайте share URL и готовьте QR без перехода в отдельный продуктовый контур."
          title="Шаринг и QR уже доступны"
        />
      )}

      <section className="glass-panel rounded-[28px] p-5 md:p-7">
        <div className="flex flex-col gap-5 border-b border-[var(--line-subtle)] pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="eyebrow">Diploma Record</div>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{diploma.full_name}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{diploma.specialty}</p>
          </div>
          <div className="min-w-0 md:max-w-[320px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Verification hash</div>
            <HashValue className="mt-2 w-full" value={diploma.verification_hash} />
          </div>
        </div>

        <div className="mt-5">
          <DefinitionGrid
            items={[
              { label: 'Номер диплома', value: diploma.diploma_number },
              { label: 'Год выпуска', value: diploma.graduation_year },
              { label: 'Статус', value: <StatusBadge status={diploma.status} /> },
              { label: 'Идентификатор записи', value: diploma.id },
            ]}
          />
        </div>
      </section>
    </div>
  )
}
