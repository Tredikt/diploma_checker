import { Link, useLocation } from 'react-router-dom'

import { roleLabels, rolePendingDescriptions } from '@/features/auth/model/auth-config'
import type { RegistrationResponse, UserRole } from '@/shared/types/auth'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { FormMessage } from '@/shared/ui/forms/FormMessage'

export function RegistrationCompletePage() {
  const location = useLocation()
  const state = location.state as { role?: UserRole; response?: RegistrationResponse } | null
  const role = state?.role ?? 'student'
  const response = state?.response
  const isStudentReady = role === 'student' && response?.is_verified

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Success State"
        title="Регистрация принята"
        description={
          isStudentReady
            ? 'Аккаунт студента создан и уже подтверждён. Можно сразу перейти ко входу и открыть студенческий контур.'
            : role === 'student'
              ? 'Аккаунт создан. Следующим шагом можно вернуться ко входу и авторизоваться в системе.'
              : rolePendingDescriptions[role as 'university' | 'company']
        }
        aside={
          <InfoCard
            label="Role"
            title={roleLabels[role]}
            description={response?.message ?? 'Результат регистрации сохранён. Дальше пользователь может перейти к авторизации или дождаться подтверждения.'}
            tone={isStudentReady ? 'accent' : 'warning'}
          />
        }
      >
        {response?.message ? <FormMessage message={response.message} tone={isStudentReady ? 'success' : 'info'} /> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-full bg-[var(--bg-ink)] px-5 py-3 text-sm font-semibold text-white" to="/auth/login">
            Перейти ко входу
          </Link>
          <Link className="rounded-full border border-[var(--line-strong)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-white/70" to="/verify">
            Открыть публичную проверку
          </Link>
        </div>
      </PageSection>
    </div>
  )
}
