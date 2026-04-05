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
  {
    label: 'Ручная проверка',
    shortLabel: 'Проверка',
    description: 'Поиск диплома по номеру и коду ВУЗа',
    to: '/app/company/verification',
    role: 'company',
  },
  {
    label: 'API-ключи',
    shortLabel: 'Ключи',
    description: 'Выпуск и отзыв ключей компании',
    to: '/app/company/api-keys',
    role: 'company',
  },
  {
    label: 'Лимиты компании',
    shortLabel: 'Лимиты',
    description: 'Квоты и текущее использование',
    to: '/app/company/limits',
    role: 'company',
  },
  {
    label: 'Мои дипломы',
    shortLabel: 'Дипломы',
    description: 'Список записей и переход в деталь',
    to: '/app/student/diplomas',
    role: 'student',
  },
]

export function getNavigationForRole(role: UserRole | null) {
  if (!role) {
    return []
  }

  return navigationItems.filter((item) => item.role === role)
}
