import { NavLink } from 'react-router-dom'

import { getNavigationForRole } from '@/shared/config/navigation'
import type { UserRole } from '@/shared/types/auth'

interface SidebarNavProps {
  role: UserRole | null
}

export function SidebarNav({ role }: SidebarNavProps) {
  const items = getNavigationForRole(role)

  return (
    <aside className="glass-panel hidden rounded-[30px] p-5 lg:block">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="eyebrow">Навигация</div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Разделы рабочего контура</p>
        </div>
        <div className="rounded-full border border-[var(--line-subtle)] bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          ВУЗ
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              [
                'group block rounded-[22px] border px-4 py-4 transition',
                isActive
                  ? 'border-[rgba(196,109,56,0.26)] bg-[linear-gradient(135deg,#24312d_0%,#31413d_100%)] text-white shadow-[0_20px_40px_rgba(17,30,26,0.18)]'
                  : 'border-transparent bg-white/58 text-[var(--text-primary)] hover:border-[var(--line-subtle)] hover:bg-white',
              ].join(' ')
            }
            to={item.to}
          >
            {({ isActive }) => (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className={['text-base font-semibold', isActive ? 'text-white' : 'text-[var(--text-primary)]'].join(' ')}>
                    {item.shortLabel ?? item.label}
                  </span>
                  {item.badge ? (
                    <span
                      className={[
                        'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
                        isActive ? 'bg-white/14 text-white' : 'bg-[var(--accent-soft)] text-[var(--accent)]',
                      ].join(' ')}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                {item.description ? (
                  <p className={['text-sm leading-5', isActive ? 'text-white/72' : 'text-[var(--text-secondary)]'].join(' ')}>
                    {item.description}
                  </p>
                ) : null}
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
