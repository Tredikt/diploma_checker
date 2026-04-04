import type { PropsWithChildren } from 'react'
import { useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/app/store/session-store'
import { roleLabels } from '@/features/auth/model/auth-config'
import { MobileNav } from '@/widgets/mobile-nav/MobileNav'
import { SidebarNav } from '@/widgets/sidebar-nav/SidebarNav'

function LogoutIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M15.75 8.25 19.5 12m0 0-3.75 3.75M19.5 12H9.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M10.5 4.875H7.875A1.875 1.875 0 0 0 6 6.75v10.5a1.875 1.875 0 0 0 1.875 1.875H10.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function AppShell({ children }: PropsWithChildren) {
  const navigate = useNavigate()
  const role = useSessionStore((state) => state.role)
  const clearSession = useSessionStore((state) => state.clearSession)
  const profile = useSessionStore((state) => state.profile)

  function handleLogout() {
    clearSession()
    navigate('/auth/login', { replace: true })
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <header className="shell-page pt-5 md:pt-7">
        <div className="glass-panel relative overflow-hidden rounded-[30px] px-5 py-5 md:px-7">
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(196,109,56,0.18),rgba(196,109,56,0))]" />
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="eyebrow">Diasoft Verification Workspace</div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Рабочий кабинет</h1>
                {role ? (
                  <span className="rounded-full border border-[rgba(196,109,56,0.18)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                    {roleLabels[role]}
                  </span>
                ) : null}
              </div>
              {profile?.email ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{profile.email}</p> : null}
            </div>
            <div className="flex items-center gap-3">
              <button
                aria-label="Выйти"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(31,43,40,0.16)] bg-white/70 px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-soft)] transition hover:-translate-y-px hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-panel)]"
                onClick={handleLogout}
                type="button"
              >
                <LogoutIcon />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="shell-page app-grid py-6">
        <SidebarNav role={role} />
        <div className="space-y-6">{children}</div>
      </main>

      <MobileNav role={role} />
    </div>
  )
}
