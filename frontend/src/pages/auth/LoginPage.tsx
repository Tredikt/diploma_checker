import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/app/store/session-store'
import { getMyProfile, login } from '@/features/auth/api/auth-api'
import { loginSchema, type LoginFormValues } from '@/features/auth/model/auth-forms'
import { roleActionLabels } from '@/features/auth/model/auth-config'
import { getApiErrorMessage, ApiError } from '@/shared/api/http-client'
import { getRoleHomePath, isPathAllowedForRole } from '@/shared/lib/role-routing'
import { FormField } from '@/shared/ui/forms/FormField'
import { FormMessage } from '@/shared/ui/forms/FormMessage'
import { AuthRoutePanel } from '@/widgets/auth-panels/AuthRoutePanel'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const role = useSessionStore((state) => state.pendingRole) ?? 'student'
  const setSession = useSessionStore((state) => state.setSession)
  const setProfile = useSessionStore((state) => state.setProfile)
  const setPendingRole = useSessionStore((state) => state.setPendingRole)
  const [formError, setFormError] = useState<string | null>(null)

  const from = useMemo(() => {
    const candidate = location.state && typeof location.state === 'object' && 'from' in location.state ? location.state.from : null
    return typeof candidate === 'string' ? candidate : null
  }, [location.state])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: async (payload: Parameters<typeof login>[0]) => {
      const response = await login(payload)

      setSession({
        accessToken: response.access_token,
        userId: response.user_id,
        role: response.user_type,
        pendingRole: response.user_type,
        isAuthenticated: true,
      })

      const profile = await getMyProfile().catch(() => null)

      return {
        response,
        profile,
      }
    },
    onSuccess: ({ profile, response }) => {
      setFormError(null)
      setProfile(profile)
      setPendingRole(response.user_type)
      setSession({
        accessToken: response.access_token,
        userId: response.user_id,
        role: response.user_type,
        pendingRole: response.user_type,
        isAuthenticated: true,
        profile,
      })

      const nextPath = from && isPathAllowedForRole(from, response.user_type) ? from : getRoleHomePath(response.user_type)
      navigate(nextPath, { replace: true })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 403 && role !== 'student') {
        navigate('/auth/pending-review', {
          replace: true,
          state: {
            role,
          },
        })
        return
      }

      setFormError(getApiErrorMessage(error, 'Не удалось войти. Проверьте email, пароль и выбранную роль.'))
    },
  })

  const handleSubmit = form.handleSubmit((values) => {
    setFormError(null)
    loginMutation.mutate({
      ...values,
      user_type: role,
    })
  })

  return (
    <AuthRoutePanel
      eyebrow="Login"
      title="Единая точка входа"
      description=""
      actions={
        <>
          <span>Нет аккаунта?</span>
          <Link className="font-semibold text-[var(--accent)]" to={`/auth/register/${role}`}>
            Регистрация {roleActionLabels[role]}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField
          autoComplete="email"
          error={form.formState.errors.email?.message}
          label="Email"
          placeholder="you@company.ru"
          {...form.register('email')}
        />

        <FormField
          autoComplete="current-password"
          error={form.formState.errors.password?.message}
          label="Пароль"
          placeholder="Минимум 8 символов"
          type="password"
          {...form.register('password')}
        />

        {formError ? <FormMessage message={formError} tone="error" /> : null}

        <button
          className="w-full rounded-full bg-[var(--bg-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--bg-ink-soft)] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loginMutation.isPending}
          type="submit"
        >
          {loginMutation.isPending ? 'Входим в систему...' : 'Войти'}
        </button>
      </form>

      <div className="mt-5 rounded-[24px] border border-[var(--line-subtle)] bg-white/55 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Контур</div>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {role === 'company'
            ? 'После входа откроются ручная проверка дипломов, API-ключи и лимиты компании.'
            : role === 'university'
              ? 'После входа откроются реестр дипломов, импорт файла и ручное создание записей.'
              : 'После входа будет доступен личный контур аккаунта и статус подключения будущих student-сервисов.'}
        </p>
      </div>
    </AuthRoutePanel>
  )
}
