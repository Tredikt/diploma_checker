import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'

import { useSessionStore } from '@/app/store/session-store'
import { getRoleHomePath } from '@/shared/lib/role-routing'
import type { UserRole } from '@/shared/types/auth'

interface RoleRouteProps extends PropsWithChildren {
  role: UserRole
}

export function RoleRoute({ role, children }: RoleRouteProps) {
  const currentRole = useSessionStore((state) => state.role)

  if (currentRole !== role) {
    if (currentRole) {
      return <Navigate replace to={getRoleHomePath(currentRole)} />
    }

    return <Navigate replace to="/auth/login" />
  }

  return children
}
