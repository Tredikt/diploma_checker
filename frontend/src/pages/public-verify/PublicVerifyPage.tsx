import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import { verifyPublicDiploma } from '@/features/public-verification/api/public-verification-api'
import { ApiError } from '@/shared/api/http-client'
import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import type { DiplomaDataMasked, DiplomaDataFull } from '@/shared/types/verification'
import { EmptyState } from '@/shared/ui/states/EmptyState'
import { ErrorState } from '@/shared/ui/states/ErrorState'
import { LoadingState } from '@/shared/ui/states/LoadingState'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isMaskedPayload(
  data: DiplomaDataMasked | DiplomaDataFull,
): data is DiplomaDataMasked {
  return 'full_name_masked' in data
}

export function PublicVerifyPage() {
  const { token } = useParams()
  const hasToken = Boolean(token)
  // Мы больше не проверяем на uuidPattern, так как новый формат токенов - строка (base64url)
  const isMalformedToken = false
  const verifyQuery = useQuery({
    queryKey: ['public-verification', token],
    queryFn: () => verifyPublicDiploma(token ?? ''),
    enabled: Boolean(token) && !isMalformedToken,
    retry: false,
    staleTime: 0,
  })

  console.log(verifyQuery)

  if (!hasToken) {
    return (
      <div className="shell-page py-6 md:py-10">
        <PageSection
          eyebrow="Public Verification"
          title="Публичная проверка диплома"
          description="Откройте страницу из письма или по QR-коду."
          aside={<InfoCard label="Статус" title="Ожидается ссылка" description="Без токена данные диплома недоступны." tone="accent" />}
        >
          <EmptyState
            title="Требуется ссылка или QR-токен"
            description="Откройте страницу из письма, QR-кода или переданной ссылки на проверку диплома."
            hint="Для ручной проверки HR-команде нужно войти в систему."
          />
        </PageSection>
      </div>
    )
  }

  if (isMalformedToken) {
    return (
      <ErrorState
        title="Ссылка проверки некорректна"
        description="Токен в URL не соответствует ожидаемому формату. Попросите отправить новую ссылку или откройте проверку из QR-кода повторно."
      />
    )
  }

  if (verifyQuery.isPending) {
    return <LoadingState title="Проверяем диплом" description="Сверяем токен и готовим безопасный результат проверки." />
  }

  if (verifyQuery.isError) {
    const isKnownClientFailure = verifyQuery.error instanceof ApiError && [400, 404, 422].includes(verifyQuery.error.status)
    return (
      <ErrorState
        title={isKnownClientFailure ? 'Не удалось подтвердить диплом' : 'Сервис проверки временно недоступен'}
        description={
          isKnownClientFailure
            ? 'Проверочный токен недействителен или ссылка больше не может быть использована.'
            : 'Попробуйте открыть ссылку позже. Если проблема повторится, свяжитесь с отправителем диплома.'
        }
      />
    )
  }

  const result = verifyQuery.data
  const maskedData = isMaskedPayload(result.data) ? result.data : null

  return (
    <div className="shell-page py-6 md:py-10">
      <PageSection
        eyebrow="Public Verification"
        title="Публичная проверка диплома"
        description="Результат проверки доступен по защищённой ссылке."
        aside={
          <InfoCard
            label={result.is_valid ? 'Статус' : 'Проверка'}
            title={result.is_valid ? 'Диплом подтверждён' : 'Требуется внимание'}
            description={result.message}
            tone={result.is_valid ? 'accent' : 'warning'}
          />
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <article className="rounded-[28px] border border-[var(--line-subtle)] bg-white/70 p-6 shadow-[var(--shadow-soft)]">
            <div className="eyebrow">{result.is_valid ? 'Verified' : 'Verification Notice'}</div>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">{maskedData?.university_name ?? 'Данные проверки ограничены'}</h2>
            <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">{result.message}</p>

            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-[var(--line-subtle)] bg-[var(--bg-panel-strong)] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Статус</dt>
                <dd className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{maskedData?.status ?? 'Недоступно'}</dd>
              </div>
              <div className="rounded-[22px] border border-[var(--line-subtle)] bg-[var(--bg-panel-strong)] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Владелец</dt>
                <dd className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{maskedData?.full_name_masked ?? 'Скрыто'}</dd>
              </div>
              <div className="rounded-[22px] border border-[var(--line-subtle)] bg-[var(--bg-panel-strong)] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Специальность</dt>
                <dd className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{maskedData?.specialty ?? 'Недоступно'}</dd>
              </div>
              <div className="rounded-[22px] border border-[var(--line-subtle)] bg-[var(--bg-panel-strong)] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Год выпуска</dt>
                <dd className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{maskedData?.issue_year ?? 'Недоступно'}</dd>
              </div>
            </dl>
          </article>

          <div className="space-y-4">
            <InfoCard
              label="Конфиденциальность"
              title="Публичный режим ограничен"
              description="Для безопасности диплома здесь не раскрываются полные персональные данные и номер документа."
            />
            <InfoCard label="Источник" title="Проверка по ссылке" description="Если требуется дополнительная сверка, используйте внутренний кабинет организации." />
          </div>
        </div>
      </PageSection>
    </div>
  )
}
