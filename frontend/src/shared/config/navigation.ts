import type { UserRole } from '@/shared/types/auth'

export interface NavigationItem {
  label: string
  to: string
  role: UserRole
}

export const navigationItems: NavigationItem[] = [
  { label: 'Реестр', to: '/app/university/registry', role: 'university' },
  { label: 'Импорт', to: '/app/university/import', role: 'university' },
  { label: 'Создать запись', to: '/app/university/create', role: 'university' },
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
