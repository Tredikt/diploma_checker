import { NavLink } from 'react-router-dom'

import { getNavigationForRole } from '@/shared/config/navigation'
import type { UserRole } from '@/shared/types/auth'

interface MobileNavProps {
  role: UserRole | null
}

export function MobileNav({ role }: MobileNavProps) {
  const items = getNavigationForRole(role)

  if (items.length === 0) {
    return null
  }

  return (
    <nav className="glass-panel fixed inset-x-4 bottom-4 z-40 rounded-full px-3 py-2 lg:hidden">
      <ul className="flex items-center justify-between gap-2">
        {items.map((item) => (
          <li className="flex-1" key={item.to}>
            <NavLink
              className={({ isActive }) =>
                [
                  'block rounded-full px-3 py-2 text-center text-xs font-semibold transition',
                  isActive
                    ? 'bg-[linear-gradient(135deg,#24312d_0%,#31413d_100%)] !text-white shadow-[0_10px_24px_rgba(17,30,26,0.18)]'
                    : 'text-[var(--text-secondary)] hover:bg-white/60',
                ].join(' ')
              }
              to={item.to}
            >
              {item.shortLabel ?? item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
