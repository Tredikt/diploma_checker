import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import {
  createStudentAccessToken,
  getStudentAccessTokens,
  getStudentDiplomaDetail,
  revokeStudentAccessToken,
} from '@/features/student/api/student-api'
import { studentQueryKeys } from '@/features/student/model/student-query'
import { getApiErrorMessage } from '@/shared/api/http-client'
import { CopyValue } from '@/shared/ui/data/CopyValue'
import { DataTableCard } from '@/shared/ui/data/DataTableCard'
import { DefinitionGrid } from '@/shared/ui/data/DefinitionGrid'
import { HashValue } from '@/shared/ui/data/HashValue'
import { InlineMetric } from '@/shared/ui/data/InlineMetric'
import { StatusBadge } from '@/shared/ui/data/StatusBadge'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import { FormField } from '@/shared/ui/forms/FormField'
import { FormMessage } from '@/shared/ui/forms/FormMessage'
import { InlineConfirmCard } from '@/shared/ui/overlay/InlineConfirmCard'
import { EmptyState } from '@/shared/ui/states/EmptyState'
import { LoadingState } from '@/shared/ui/states/LoadingState'
import type { StudentAccessTokenListItem } from '@/shared/types/student'

const TOKEN_PAGE_SIZE = 8
const DEFAULT_TTL_DAYS = 7

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getTtlValidationError(value: string) {
  if (!value.trim()) {
    return 'Укажите срок действия ссылки.'
  }

  const ttlDays = Number(value)

  if (!Number.isInteger(ttlDays)) {
    return 'Срок должен быть целым числом дней.'
  }

  if (ttlDays < 1 || ttlDays > 90) {
    return 'Допустимый диапазон: от 1 до 90 дней.'
  }

  return null
}

function StudentAccessTokenRow({
  diplomaId,
  item,
  isConfirming,
  onRequestRevoke,
  onCancelRevoke,
  onConfirmRevoke,
  isPending,
}: {
  diplomaId: string
  item: StudentAccessTokenListItem
  isConfirming: boolean
  onRequestRevoke: () => void
  onCancelRevoke: () => void
  onConfirmRevoke: () => void
  isPending: boolean
}) {
  const maskedTokenValue = `${item.token_value.slice(0, 8)}...${item.token_value.slice(-6)}`

  return (
    <>
      <tr className="border-b border-[var(--line-subtle)] last:border-b-0">
        <td className="px-4 py-4 align-middle">
          <div className="flex min-h-16 flex-col justify-center gap-2">
            <CopyValue
              className="w-full"
              copyLabel="токен доступа"
              title={item.token_value}
              value={item.token_value}
              visibleValue={maskedTokenValue}
            />
          </div>
        </td>
        <td className="px-4 py-4 align-middle">
          <CopyValue className="max-w-[280px]" copyLabel="ссылку" title={item.share_url} value={item.share_url} visibleValue="Скопировать share URL" />
        </td>
        <td className="whitespace-nowrap px-4 py-4 align-middle">
          <StatusBadge status={item.status} />
        </td>
        <td className="whitespace-nowrap px-4 py-4 align-middle text-sm text-[var(--text-secondary)]">{formatDateTime(item.created_at)}</td>
        <td className="whitespace-nowrap px-4 py-4 align-middle text-sm text-[var(--text-secondary)]">{formatDateTime(item.expires_at)}</td>
        <td className="px-4 py-4 align-middle">
          <div className="flex min-h-16 flex-wrap items-center gap-2">
            <Link
              className="rounded-full border border-[var(--line-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-white/70"
              to={`/app/student/diplomas/${diplomaId}/access/${item.id}/qr`}
            >
              Показать QR
            </Link>
            <a
              className="rounded-full border border-[var(--line-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-white/70"
              href={item.share_url}
              rel="noreferrer"
              target="_blank"
            >
              Открыть ссылку
            </a>
            <button
              className="rounded-full border border-[rgba(178,79,67,0.24)] px-3 py-2 text-xs font-semibold text-[var(--danger)] transition hover:bg-[rgba(178,79,67,0.06)] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={isPending}
              onClick={onRequestRevoke}
              type="button"
            >
              Отозвать
            </button>
          </div>
        </td>
      </tr>
      {isConfirming ? (
        <tr className="border-b border-[var(--line-subtle)] bg-[rgba(255,252,246,0.72)]">
          <td className="px-4 py-4" colSpan={6}>
            <InlineConfirmCard
              cancelLabel="Оставить активным"
              confirmLabel="Подтвердить отзыв"
              description="После отзыва ссылка и QR перестанут работать."
              isPending={isPending}
              onCancel={onCancelRevoke}
              onConfirm={onConfirmRevoke}
              title="Отозвать доступ?"
            />
          </td>
        </tr>
      ) : null}
    </>
  )
}

function StudentAccessTokenMobileCard({
  diplomaId,
  item,
  isConfirming,
  onRequestRevoke,
  onCancelRevoke,
  onConfirmRevoke,
  isPending,
}: {
  diplomaId: string
  item: StudentAccessTokenListItem
  isConfirming: boolean
  onRequestRevoke: () => void
  onCancelRevoke: () => void
  onConfirmRevoke: () => void
  isPending: boolean
}) {
  const maskedTokenValue = `${item.token_value.slice(0, 8)}...${item.token_value.slice(-6)}`

  return (
    <article className="rounded-[24px] border border-[var(--line-subtle)] bg-white/60 p-4 shadow-[var(--shadow-soft)]">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Публичная ссылка</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">Создан {formatDateTime(item.created_at)}</div>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <CopyValue
          className="w-full"
          copyLabel="токен доступа"
          title={item.token_value}
          value={item.token_value}
          visibleValue={maskedTokenValue}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-[18px] border border-[var(--line-subtle)] bg-[rgba(255,255,255,0.55)] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Истекает</div>
            <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{formatDateTime(item.expires_at)}</div>
          </div>
          <div className="rounded-[18px] border border-[var(--line-subtle)] bg-[rgba(255,255,255,0.55)] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Ссылка</div>
            <div className="mt-2">
              <CopyValue className="w-full" copyLabel="ссылку" title={item.share_url} value={item.share_url} visibleValue="Скопировать URL" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-full border border-[var(--line-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-white/70"
            to={`/app/student/diplomas/${diplomaId}/access/${item.id}/qr`}
          >
            Показать QR
          </Link>
          <a
            className="rounded-full border border-[var(--line-strong)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-white/70"
            href={item.share_url}
            rel="noreferrer"
            target="_blank"
          >
            Открыть ссылку
          </a>
          <button
            className="rounded-full border border-[rgba(178,79,67,0.24)] px-3 py-2 text-xs font-semibold text-[var(--danger)] transition hover:bg-[rgba(178,79,67,0.06)] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={isPending}
            onClick={onRequestRevoke}
            type="button"
          >
            Отозвать
          </button>
        </div>

        {isConfirming ? (
          <InlineConfirmCard
            cancelLabel="Оставить активным"
            confirmLabel="Подтвердить отзыв"
            description="После отзыва ссылка и QR перестанут работать."
            isPending={isPending}
            onCancel={onCancelRevoke}
            onConfirm={onConfirmRevoke}
            title="Отозвать доступ?"
          />
        ) : null}
      </div>
    </article>
  )
}

export function StudentAccessManagementPage() {
  const { diplomaId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [ttlDays, setTtlDays] = useState(String(DEFAULT_TTL_DAYS))
  const [ttlError, setTtlError] = useState<string | null>(null)
  const [activeConfirmTokenId, setActiveConfirmTokenId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const resolvedDiplomaId = diplomaId ?? ''
  const offset = Number(searchParams.get('offset') ?? '0')
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0

  const diplomaQuery = useQuery({
    queryKey: studentQueryKeys.detail(resolvedDiplomaId),
    queryFn: () => getStudentDiplomaDetail(resolvedDiplomaId),
    enabled: Boolean(resolvedDiplomaId),
  })

  const tokensQuery = useQuery({
    queryKey: studentQueryKeys.tokens(resolvedDiplomaId, TOKEN_PAGE_SIZE, safeOffset),
    queryFn: () => getStudentAccessTokens({ diplomaId: resolvedDiplomaId, limit: TOKEN_PAGE_SIZE, offset: safeOffset }),
    enabled: Boolean(resolvedDiplomaId),
  })

  const createMutation = useMutation({
    mutationFn: (nextTtlDays: number) =>
      createStudentAccessToken({
        diploma_id: resolvedDiplomaId,
        ttl_days: nextTtlDays,
      }),
    onSuccess: async () => {
      setTtlDays(String(DEFAULT_TTL_DAYS))
      setTtlError(null)
      setSearchParams({})
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['student', 'diplomas', resolvedDiplomaId, 'tokens'] }),
        queryClient.invalidateQueries({ queryKey: studentQueryKeys.detail(resolvedDiplomaId) }),
      ])
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (tokenId: string) => revokeStudentAccessToken(tokenId),
    onSuccess: async () => {
      setActiveConfirmTokenId(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['student', 'diplomas', resolvedDiplomaId, 'tokens'] }),
        queryClient.invalidateQueries({ queryKey: studentQueryKeys.detail(resolvedDiplomaId) }),
      ])
    },
  })

  if (!resolvedDiplomaId) {
    return <EmptyState description="Маршрут не содержит идентификатор диплома." title="Не удалось открыть доступы" />
  }

  if (diplomaQuery.isLoading || tokensQuery.isLoading) {
    return <LoadingState description="Подготавливаем карточку диплома и историю выданных доступов." title="Загружаем доступы" />
  }

  if (diplomaQuery.isError) {
    return (
      <EmptyState
        description={getApiErrorMessage(diplomaQuery.error, 'Не удалось загрузить диплом для управления доступом.')}
        hint="Вернитесь в список дипломов и откройте запись повторно."
        title="Диплом недоступен"
      />
    )
  }

  const diploma = diplomaQuery.data

  if (!diploma) {
    return <EmptyState description="Запись диплома временно недоступна." title="Нет данных о дипломе" />
  }

  const isAnnulled = diploma.status === 'annulled'
  const tokenData = tokensQuery.data
  const tokenItems = tokenData?.items ?? []
  const hasNextPage = tokenData ? tokenData.offset + tokenData.limit < tokenData.total : false

  function setOffset(nextOffset: number) {
    const nextParams = new URLSearchParams(searchParams)

    if (nextOffset > 0) {
      nextParams.set('offset', String(nextOffset))
    } else {
      nextParams.delete('offset')
    }

    setSearchParams(nextParams)
  }

  function handleCreateToken(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = getTtlValidationError(ttlDays)

    if (validationError) {
      setTtlError(validationError)
      return
    }

    createMutation.mutate(Number(ttlDays))
  }

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Student Access"
        title="Управление доступом"
        description="Ссылка и QR для проверки диплома."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Link className="text-sm font-semibold text-[var(--accent)]" to={`/app/student/diplomas/${diploma.id}`}>
            Вернуться к детали диплома
          </Link>
          <StatusBadge status={diploma.status} />
        </div>
      </PageSection>

      <section className="glass-panel rounded-[28px] p-5 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="eyebrow">Diploma Summary</div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{diploma.full_name}</h2>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{diploma.specialty}</p>
            </div>

            <DefinitionGrid
              items={[
                { label: 'Номер диплома', value: diploma.diploma_number },
                { label: 'Год выпуска', value: diploma.graduation_year },
                { label: 'Статус', value: <StatusBadge status={diploma.status} /> },
                { label: 'Verification hash', value: <HashValue value={diploma.verification_hash} /> },
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <InlineMetric label="Выдано доступов" value={String(tokenData?.total ?? 0)} />
            <InlineMetric label="Статус шаринга" value={isAnnulled ? 'Закрыт' : 'Доступен'} />
          </div>
        </div>
      </section>

      {isAnnulled ? (
        <FormMessage message="Диплом аннулирован. Новые ссылки выпускать нельзя." tone="info" />
      ) : null}

      <DataTableCard title="Выпуск нового доступа">
        <form className="grid gap-4 md:grid-cols-[minmax(0,220px)_auto] md:items-center" onSubmit={handleCreateToken}>
          <FormField
            error={ttlError ?? undefined}
            hint="От 1 до 90 дней. По умолчанию 7."
            inputMode="numeric"
            label="Срок действия, дней"
            max={90}
            min={1}
            name="ttl_days"
            onChange={(event) => {
              setTtlDays(event.target.value)
              if (ttlError) {
                setTtlError(null)
              }
            }}
            placeholder="7"
            type="number"
            value={ttlDays}
          />
          <div className="flex flex-col justify-center gap-3">
            <button
              className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--bg-ink)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--bg-ink-soft)] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isAnnulled || createMutation.isPending}
              type="submit"
            >
              {createMutation.isPending ? 'Выпускаем доступ...' : 'Создать доступ'}
            </button>
            {isAnnulled ? <FormMessage message="Для аннулированного диплома выпуск новых ссылок и QR недоступен." tone="info" /> : null}
          </div>
        </form>

        {createMutation.isError ? (
          <div className="mt-4">
            <FormMessage message={getApiErrorMessage(createMutation.error, 'Не удалось создать доступ.')} tone="error" />
          </div>
        ) : null}

        {createMutation.isSuccess ? (
          <div className="mt-4">
            <FormMessage message="Новый доступ выпущен. Он уже доступен в реестре ниже." tone="success" />
          </div>
        ) : null}
      </DataTableCard>

      <DataTableCard description="Активные и завершённые ссылки по этому диплому." title="Реестр доступов">
        {tokensQuery.isError ? (
          <FormMessage message={getApiErrorMessage(tokensQuery.error, 'Не удалось загрузить историю доступов.')} tone="error" />
        ) : null}

        {!tokensQuery.isError && tokenItems.length === 0 ? (
          <EmptyState
            description="Для этого диплома ещё не выпускались share-ссылки и QR."
            hint="Создайте первый доступ выше, чтобы передать проверку работодателю."
            title="История доступов пуста"
          />
        ) : null}

        {!tokensQuery.isError && tokenItems.length > 0 ? (
          <>
            <div className="space-y-3 md:hidden">
              {tokenItems.map((item) =>
                item.status === 'active' ? (
                  <StudentAccessTokenMobileCard
                    diplomaId={diploma.id}
                    isConfirming={activeConfirmTokenId === item.id}
                    isPending={revokeMutation.isPending && revokeMutation.variables === item.id}
                    item={item}
                    key={item.id}
                    onCancelRevoke={() => setActiveConfirmTokenId(null)}
                    onConfirmRevoke={() => revokeMutation.mutate(item.id)}
                    onRequestRevoke={() => setActiveConfirmTokenId(item.id)}
                  />
                ) : (
                  <article className="rounded-[24px] border border-[var(--line-subtle)] bg-white/60 p-4 shadow-[var(--shadow-soft)]" key={item.id}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[var(--text-primary)]">Публичная ссылка</div>
                          <div className="mt-1 text-xs text-[var(--text-muted)]">Создан {formatDateTime(item.created_at)}</div>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      <CopyValue
                        className="w-full"
                        copyLabel="токен доступа"
                        title={item.token_value}
                        value={item.token_value}
                        visibleValue={`${item.token_value.slice(0, 8)}...${item.token_value.slice(-6)}`}
                      />
                      <div className="text-sm leading-6 text-[var(--text-secondary)]">
                        Доступ завершён. Запись сохранена в истории.
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>

            <div className="hidden overflow-hidden rounded-[24px] border border-[var(--line-subtle)] md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--line-subtle)] text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <th className="px-4 py-3">Токен</th>
                      <th className="px-4 py-3">Share URL</th>
                      <th className="px-4 py-3">Статус</th>
                      <th className="px-4 py-3">Создан</th>
                      <th className="px-4 py-3">Истекает</th>
                      <th className="px-4 py-3">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokenItems.map((item) =>
                      item.status === 'active' ? (
                        <StudentAccessTokenRow
                          diplomaId={diploma.id}
                          isConfirming={activeConfirmTokenId === item.id}
                          isPending={revokeMutation.isPending && revokeMutation.variables === item.id}
                          item={item}
                          key={item.id}
                          onCancelRevoke={() => setActiveConfirmTokenId(null)}
                          onConfirmRevoke={() => revokeMutation.mutate(item.id)}
                          onRequestRevoke={() => setActiveConfirmTokenId(item.id)}
                        />
                      ) : (
                        <tr className="border-b border-[var(--line-subtle)] last:border-b-0" key={item.id}>
                          <td className="px-4 py-4 align-middle">
                            <div className="flex min-h-16 flex-col justify-center gap-2">
                              <CopyValue
                                className="w-full"
                                copyLabel="токен доступа"
                                title={item.token_value}
                                value={item.token_value}
                                visibleValue={`${item.token_value.slice(0, 8)}...${item.token_value.slice(-6)}`}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4 align-middle text-sm text-[var(--text-secondary)]">Недоступна</td>
                          <td className="px-4 py-4 align-middle">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 align-middle text-sm text-[var(--text-secondary)]">{formatDateTime(item.created_at)}</td>
                          <td className="whitespace-nowrap px-4 py-4 align-middle text-sm text-[var(--text-secondary)]">{formatDateTime(item.expires_at)}</td>
                          <td className="px-4 py-4 align-middle text-sm text-[var(--text-secondary)]">Только история</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {revokeMutation.isError ? (
              <div className="mt-4">
                <FormMessage message={getApiErrorMessage(revokeMutation.error, 'Не удалось отозвать доступ.')} tone="error" />
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 rounded-[24px] border border-[var(--line-subtle)] bg-white/50 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-[var(--text-secondary)]">
                Показаны доступы {tokenData ? tokenData.offset + 1 : 0}-{tokenData ? tokenData.offset + tokenItems.length : tokenItems.length} из {tokenData?.total ?? tokenItems.length}
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={safeOffset === 0}
                  onClick={() => setOffset(Math.max(safeOffset - TOKEN_PAGE_SIZE, 0))}
                  type="button"
                >
                  Назад
                </button>
                <button
                  className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!hasNextPage}
                  onClick={() => setOffset(safeOffset + TOKEN_PAGE_SIZE)}
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
