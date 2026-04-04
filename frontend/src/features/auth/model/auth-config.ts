import type { UserRole } from '@/shared/types/auth'

export const roleLabels: Record<UserRole, string> = {
  university: 'ВУЗ',
  student: 'Студент',
  company: 'HR',
}

export const roleNames: Record<UserRole, string> = {
  university: 'университета',
  student: 'студента',
  company: 'компании',
}

export const roleDescriptions: Record<UserRole, string> = {
  university: 'Работа с реестром дипломов, импортом и статусами записей.',
  student: 'Личный вход в систему и дальнейший доступ к студенческому контуру.',
  company: 'Ручная проверка дипломов и интеграционные сценарии для HR-команды.',
}

export const rolePendingDescriptions: Record<Exclude<UserRole, 'student'>, string> = {
  university: 'Организация зарегистрирована, но доступ к кабинету откроется только после подтверждения администратором.',
  company: 'Компания отправлена на проверку. После подтверждения появится доступ к ручной верификации и API.',
}
