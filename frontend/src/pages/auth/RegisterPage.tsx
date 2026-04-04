import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { registerCompany, registerStudent, registerUniversity } from '@/features/auth/api/auth-api'
import {
  companyRegistrationSchema,
  studentRegistrationSchema,
  universityRegistrationSchema,
  type CompanyRegistrationFormValues,
  type StudentRegistrationFormValues,
  type UniversityRegistrationFormValues,
} from '@/features/auth/model/auth-forms'
import { roleActionLabels } from '@/features/auth/model/auth-config'
import { getApiErrorMessage } from '@/shared/api/http-client'
import { FormField } from '@/shared/ui/forms/FormField'
import { FormMessage } from '@/shared/ui/forms/FormMessage'
import { AuthRoutePanel } from '@/widgets/auth-panels/AuthRoutePanel'

export function RegisterPage() {
  const navigate = useNavigate()
  const { role: roleParam = 'student' } = useParams()
  const role = roleParam === 'university' || roleParam === 'company' || roleParam === 'student' ? roleParam : 'student'
  const [formError, setFormError] = useState<string | null>(null)

  const universityForm = useForm<UniversityRegistrationFormValues>({
    resolver: zodResolver(universityRegistrationSchema),
    defaultValues: {
      code: '',
      name: '',
      email: '',
      password: '',
      public_key: '',
    },
  })

  const companyForm = useForm<CompanyRegistrationFormValues>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues: {
      company_name: '',
      email: '',
      password: '',
    },
  })

  const studentForm = useForm<StudentRegistrationFormValues>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      email: '',
      password: '',
      last_name: '',
      first_name: '',
      patronymic: '',
      diploma_number: '',
    },
  })

  const registrationMutation = useMutation({
    mutationFn: async (values: UniversityRegistrationFormValues | CompanyRegistrationFormValues | StudentRegistrationFormValues) => {
      if (role === 'university') {
        const payload = values as UniversityRegistrationFormValues
        return registerUniversity({
          ...payload,
          public_key: payload.public_key || null,
        })
      }

      if (role === 'company') {
        return registerCompany(values as CompanyRegistrationFormValues)
      }

      const payload = values as StudentRegistrationFormValues
      return registerStudent({
        ...payload,
        patronymic: payload.patronymic || null,
      })
    },
    onSuccess: (response) => {
      setFormError(null)
      navigate('/auth/registration-complete', {
        replace: true,
        state: {
          role,
          response,
        },
      })
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, 'Не удалось завершить регистрацию. Проверьте введённые данные и повторите попытку.'))
    },
  })

  const handleUniversitySubmit = universityForm.handleSubmit((values) => {
    setFormError(null)
    registrationMutation.mutate(values)
  })

  const handleCompanySubmit = companyForm.handleSubmit((values) => {
    setFormError(null)
    registrationMutation.mutate(values)
  })

  const handleStudentSubmit = studentForm.handleSubmit((values) => {
    setFormError(null)
    registrationMutation.mutate(values)
  })

  return (
    <AuthRoutePanel
      eyebrow="Registration"
      title={`Регистрация ${roleActionLabels[role]}`}
      description=""
      actions={
        <>
          <span>Аккаунт уже существует?</span>
          <Link className="font-semibold text-[var(--accent)]" to="/auth/login">
            Вернуться ко входу
          </Link>
        </>
      }
    >
      {role === 'university' ? (
        <form className="space-y-4" onSubmit={handleUniversitySubmit}>
          <FormField error={universityForm.formState.errors.code?.message} label="Код ВУЗа" placeholder="MGU-01" {...universityForm.register('code')} />
          <FormField error={universityForm.formState.errors.name?.message} label="Название" placeholder="МГУ" {...universityForm.register('name')} />
          <FormField autoComplete="email" error={universityForm.formState.errors.email?.message} label="Email" placeholder="admin@university.ru" {...universityForm.register('email')} />
          <FormField autoComplete="new-password" error={universityForm.formState.errors.password?.message} label="Пароль" placeholder="Минимум 8 символов" type="password" {...universityForm.register('password')} />
          <FormField error={universityForm.formState.errors.public_key?.message} label="Публичный ключ" placeholder="-----BEGIN PUBLIC KEY-----" {...universityForm.register('public_key')} />
          {formError ? <FormMessage message={formError} tone="error" /> : null}
          <button className="w-full rounded-full bg-[var(--bg-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--bg-ink-soft)] disabled:cursor-not-allowed disabled:opacity-70" disabled={registrationMutation.isPending} type="submit">
            {registrationMutation.isPending ? 'Отправляем заявку...' : 'Зарегистрировать ВУЗ'}
          </button>
        </form>
      ) : null}

      {role === 'company' ? (
        <form className="space-y-4" onSubmit={handleCompanySubmit}>
          <FormField error={companyForm.formState.errors.company_name?.message} label="Название компании" placeholder="ACME HR" {...companyForm.register('company_name')} />
          <FormField autoComplete="email" error={companyForm.formState.errors.email?.message} label="Email" placeholder="hr@company.ru" {...companyForm.register('email')} />
          <FormField autoComplete="new-password" error={companyForm.formState.errors.password?.message} label="Пароль" placeholder="Минимум 8 символов" type="password" {...companyForm.register('password')} />
          {formError ? <FormMessage message={formError} tone="error" /> : null}
          <button className="w-full rounded-full bg-[var(--bg-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--bg-ink-soft)] disabled:cursor-not-allowed disabled:opacity-70" disabled={registrationMutation.isPending} type="submit">
            {registrationMutation.isPending ? 'Создаём профиль...' : 'Зарегистрировать компанию'}
          </button>
        </form>
      ) : null}

      {role === 'student' ? (
        <form className="space-y-4" onSubmit={handleStudentSubmit}>
          <FormField autoComplete="email" error={studentForm.formState.errors.email?.message} label="Email" placeholder="student@example.ru" {...studentForm.register('email')} />
          <FormField autoComplete="new-password" error={studentForm.formState.errors.password?.message} label="Пароль" placeholder="Минимум 8 символов" type="password" {...studentForm.register('password')} />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField error={studentForm.formState.errors.last_name?.message} label="Фамилия" placeholder="Иванов" {...studentForm.register('last_name')} />
            <FormField error={studentForm.formState.errors.first_name?.message} label="Имя" placeholder="Иван" {...studentForm.register('first_name')} />
          </div>
          <FormField error={studentForm.formState.errors.patronymic?.message} label="Отчество" placeholder="Иванович" {...studentForm.register('patronymic')} />
          <FormField error={studentForm.formState.errors.diploma_number?.message} label="Номер диплома" placeholder="ABC-12345" {...studentForm.register('diploma_number')} />
          {formError ? <FormMessage message={formError} tone="error" /> : null}
          <button className="w-full rounded-full bg-[var(--bg-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--bg-ink-soft)] disabled:cursor-not-allowed disabled:opacity-70" disabled={registrationMutation.isPending} type="submit">
            {registrationMutation.isPending ? 'Проверяем данные...' : 'Зарегистрировать студента'}
          </button>
        </form>
      ) : null}
    </AuthRoutePanel>
  )
}
