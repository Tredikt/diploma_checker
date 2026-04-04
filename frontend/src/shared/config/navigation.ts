import type { UserRole } from '@/shared/types/auth'

export interface NavigationItem {
  label: string
  shortLabel?: string
  description?: string
  badge?: string
  to: string
  role: UserRole
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'Реестр дипломов',
    shortLabel: 'Реестр',
    description: 'Список записей и статусов',
    to: '/app/university/registry',
    role: 'university',
  },
  {
    label: 'Импорт реестра',
    shortLabel: 'Импорт',
    description: 'Пакетная загрузка файла',
    to: '/app/university/import',
    role: 'university',
  },
  {
    label: 'Создание записи',
    shortLabel: 'Создать',
    description: 'Ручное добавление диплома',
    to: '/app/university/create',
    role: 'university',
  },
  { label: 'Проверка', to: '/app/company/verification', role: 'company' },
  { label: 'API-ключи', to: '/app/company/api-keys', role: 'company' },
  { label: 'Лимиты', to: '/app/company/limits', role: 'company' },
  { label: 'Кабинет', to: '/app/student/home', role: 'student' },
]

export function getNavigationForRole(role: UserRole | null) {
  if (!role) {
    return []
  }

  return navigationItems.filter((item) => item.role === role)
}
