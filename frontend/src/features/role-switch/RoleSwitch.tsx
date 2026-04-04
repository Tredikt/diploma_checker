import { Link, useLocation } from 'react-router-dom'

import { useSessionStore } from '@/app/store/session-store'
import { roleLabels } from '@/features/auth/model/auth-config'
import { cn } from '@/shared/lib/cn'
import { userRoles } from '@/shared/types/auth'

export function RoleSwitch() {
  const location = useLocation()
  const pendingRole = useSessionStore((state) => state.pendingRole)
  const setPendingRole = useSessionStore((state) => state.setPendingRole)

  return (
    <div className="grid grid-cols-3 gap-2 rounded-full bg-[rgba(255,255,255,0.6)] p-1">
      {userRoles.map((role) => {
        const isActive =
          pendingRole === role || location.pathname.includes(`/register/${role}`) || (location.pathname.endsWith('/login') && pendingRole === role)

        return (
          <Link
            key={role}
            aria-label={`Выбрать роль ${roleLabels[role]}`}
            className={cn(
              'rounded-full px-3 py-2 text-center text-sm font-semibold transition',
              isActive ? 'bg-[var(--bg-ink)] text-white' : 'text-[var(--text-secondary)] hover:bg-white/80',
            )}
            onClick={() => setPendingRole(role)}
            to={location.pathname.startsWith('/auth/register') ? `/auth/register/${role}` : '/auth/login'}
          >
            {roleLabels[role]}
          </Link>
        )
      })}
    </div>
  )
}
