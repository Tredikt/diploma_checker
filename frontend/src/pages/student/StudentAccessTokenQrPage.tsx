import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { getStudentAccessTokenQr, getStudentAccessTokens } from '@/features/student/api/student-api'
import { studentQueryKeys } from '@/features/student/model/student-query'
import { API_BASE_URL, ApiError, getApiErrorMessage } from '@/shared/api/http-client'
import { StatusBadge } from '@/shared/ui/data/StatusBadge'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import { FormMessage } from '@/shared/ui/forms/FormMessage'
import { EmptyState } from '@/shared/ui/states/EmptyState'
import { LoadingState } from '@/shared/ui/states/LoadingState'

const TOKEN_LOOKUP_LIMIT = 100

export function StudentAccessTokenQrPage() {
  const { diplomaId, tokenId } = useParams()
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  const tokensQuery = useQuery({
    queryKey: studentQueryKeys.tokens(diplomaId ?? '', TOKEN_LOOKUP_LIMIT, 0),
    queryFn: () => getStudentAccessTokens({ diplomaId: diplomaId ?? '', limit: TOKEN_LOOKUP_LIMIT, offset: 0 }),
    enabled: Boolean(diplomaId),
  })

  const token = useMemo(
    () => tokensQuery.data?.items.find((item) => item.id === tokenId) ?? null,
    [tokenId, tokensQuery.data?.items],
  )
  const publicVerifyUrl = token?.share_url ?? null

  const qrQuery = useQuery({
    queryKey: studentQueryKeys.tokenQr(tokenId ?? ''),
    queryFn: () => getStudentAccessTokenQr(tokenId ?? ''),
    enabled: Boolean(tokenId) && token?.status === 'active',
    retry: false,
  })

  useEffect(() => {
    if (!qrQuery.data) {
      setQrUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl)
        }

        return null
      })
      return
    }

    const nextUrl = URL.createObjectURL(qrQuery.data)
    setQrUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }

      return nextUrl
    })

    return () => {
      URL.revokeObjectURL(nextUrl)
    }
  }, [qrQuery.data])

  if (!diplomaId || !tokenId) {
    return <EmptyState description="Маршрут QR не содержит нужные идентификаторы." title="Не удалось открыть QR" />
  }

  if (tokensQuery.isLoading) {
    return <LoadingState description="Проверяем ссылку и готовим QR." title="Загружаем QR" />
  }

  if (tokensQuery.isError) {
    return (
      <EmptyState
        description={getApiErrorMessage(tokensQuery.error, 'Не удалось загрузить данные токена.')}
        hint="Вернитесь к управлению доступом и попробуйте снова."
        title="Токен недоступен"
      />
    )
  }

  if (!token) {
    return (
      <EmptyState
        description="Этот access token не найден в истории выбранного диплома."
        hint="Вернитесь к управлению доступом и откройте актуальную запись."
        title="Токен не найден"
      />
    )
  }

  const isBlocked = token.status !== 'active'
  const blockedTitle = token.status === 'revoked' ? 'QR недоступен после отзыва' : 'Срок действия QR истёк'
  const blockedDescription =
    token.status === 'revoked'
      ? 'Ссылка и QR отозваны.'
      : 'Срок действия ссылки завершён.'

  async function handleDownload() {
    if (!qrUrl) {
      return
    }

    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `diploma-access-${tokenId}.png`
    link.click()
  }

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Student QR"
        title="QR и ссылка"
        description="Проверка диплома по публичной ссылке."
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={token.status} />
          <Link className="text-sm font-semibold text-[var(--accent)]" to={`/app/student/diplomas/${diplomaId}/access`}>
            Вернуться к управлению доступом
          </Link>
        </div>
      </PageSection>

      {isBlocked ? (
        <FormMessage message={`${blockedTitle}. ${blockedDescription}`} tone="info" />
      ) : null}

      <section className="glass-panel rounded-[28px] p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-[var(--line-subtle)] bg-[var(--bg-panel-strong)] p-5">
            <div className="eyebrow">QR Preview</div>
            {isBlocked ? (
              <div className="mt-4 rounded-[22px] border border-[rgba(185,121,44,0.18)] bg-[rgba(185,121,44,0.08)] p-5 text-sm leading-6 text-[var(--text-secondary)]">
                QR скрыт: доступ неактивен.
              </div>
            ) : qrQuery.isLoading ? (
              <LoadingState description="Получаем изображение QR." title="Подготавливаем QR" />
            ) : qrQuery.isError ? (
              <EmptyState
                description={
                  qrQuery.error instanceof ApiError && [404, 410, 422].includes(qrQuery.error.status)
                    ? 'QR больше недоступен. Проверьте статус ссылки.'
                    : getApiErrorMessage(qrQuery.error, 'Не удалось загрузить QR.')
                }
                title="QR недоступен"
              />
            ) : qrUrl ? (
              <div className="mt-4 flex flex-col items-center gap-4">
                <img alt="QR для проверки диплома" className="w-full max-w-[320px] rounded-[24px] border border-[var(--line-subtle)] bg-white p-4 shadow-[var(--shadow-soft)]" src={qrUrl} />
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    className="rounded-full bg-[var(--bg-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--bg-ink-soft)]"
                    onClick={handleDownload}
                    type="button"
                  >
                    Скачать QR
                  </button>
                  <a
                    className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/70"
                    href={qrUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Открыть изображение
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-[var(--line-subtle)] bg-white/60 p-5 shadow-[var(--shadow-soft)]">
              <div className="eyebrow">Public Verify</div>
              <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Публичная ссылка</h2>
              <p className="mt-2 break-all text-sm leading-6 text-[var(--text-secondary)]">{publicVerifyUrl}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-white/70"
                  href={publicVerifyUrl ?? undefined}
                  rel="noreferrer"
                  target="_blank"
                >
                  Открыть ссылку
                </a>
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--line-subtle)] bg-white/60 p-5 shadow-[var(--shadow-soft)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Токен</div>
              <div className="mt-2 break-all text-sm text-[var(--text-secondary)]">{token.token_value}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
