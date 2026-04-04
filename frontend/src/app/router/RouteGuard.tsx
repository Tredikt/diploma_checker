import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useSessionStore } from '@/app/store/session-store'
import { LoadingState } from '@/shared/ui/states/LoadingState'

export function RouteGuard({ children }: PropsWithChildren) {
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated)
  const isBootstrapping = useSessionStore((state) => state.isBootstrapping)
  const location = useLocation()

  if (isBootstrapping) {
    return <LoadingState title="Проверяем сессию" description="Сверяем refresh cookie и готовим рабочее пространство." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }

  return children
}
