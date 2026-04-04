import { Navigate } from 'react-router-dom'

import { useSessionStore } from '@/app/store/session-store'
import { getRoleHomePath } from '@/shared/lib/role-routing'

export function AppHomeRedirect() {
  const role = useSessionStore((state) => state.role)

  if (!role) {
    return <Navigate replace to="/auth/login" />
  }

  return <Navigate replace to={getRoleHomePath(role)} />
}
