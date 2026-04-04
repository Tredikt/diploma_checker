import type { UserRole } from '@/shared/types/auth'

export const roleLabels: Record<UserRole, string> = {
  university: 'ВУЗ',
  student: 'Студент',
  company: 'HR',
}

export const roleActionLabels: Record<UserRole, string> = {
  university: 'ВУЗа',
  student: 'студента',
  company: 'компании',
}

export const roleNames: Record<UserRole, string> = {
  university: 'университета',
  student: 'студента',
  company: 'компании',
}

export const roleDescriptions: Record<UserRole, string> = {
  university: '',
  student: '',
  company: '',
}

export const rolePendingDescriptions: Record<Exclude<UserRole, 'student'>, string> = {
  university: 'Организация зарегистрирована. Доступ к кабинету откроется после подтверждения со стороны администратора.',
  company: 'Компания принята в обработку. После подтверждения откроется доступ к ручной верификации и API.',
}
