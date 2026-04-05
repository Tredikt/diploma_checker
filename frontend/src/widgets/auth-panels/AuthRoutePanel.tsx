import type { ReactNode } from 'react'

import { RoleSwitch } from '@/features/role-switch/RoleSwitch'

interface AuthRoutePanelProps {
  eyebrow: string
  title: string
  description: string
  note?: string
  actions?: ReactNode
  children?: ReactNode
}

export function AuthRoutePanel({ eyebrow, title, description, note, actions, children }: AuthRoutePanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="text-[2rem] font-semibold leading-tight text-[var(--text-primary)] md:text-[2.35rem]">{title}</h2>
        {description ? <p className="muted-copy max-w-xl text-base">{description}</p> : null}
      </div>

      <RoleSwitch />

      {note ? (
        <div className="rounded-[24px] border border-[var(--line-subtle)] bg-white/58 p-5">
          <p className="text-sm leading-6 text-[var(--text-secondary)]">{note}</p>
        </div>
      ) : null}

      {children ? <div className="space-y-5">{children}</div> : null}

      {actions ? <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">{actions}</div> : null}
    </div>
  )
}
