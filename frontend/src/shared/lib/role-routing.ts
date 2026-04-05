import type { UserRole } from '@/shared/types/auth'

export const roleHomePaths: Record<UserRole, string> = {
  university: '/app/university/registry',
  company: '/app/company/verification',
  student: '/app/student/diplomas',
}

export function getRoleHomePath(role: UserRole) {
  return roleHomePaths[role]
}

export function isPathAllowedForRole(pathname: string, role: UserRole) {
  return pathname.startsWith(`/app/${role}/`)
}
