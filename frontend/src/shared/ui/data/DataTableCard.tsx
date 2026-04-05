import type { PropsWithChildren, ReactNode } from 'react'

interface DataTableCardProps extends PropsWithChildren {
  title: string
  description?: string
  actions?: ReactNode
}

export function DataTableCard({ title, description, actions, children }: DataTableCardProps) {
  return (
    <section className="glass-panel rounded-[28px] p-5 md:p-6">
      <div className="flex flex-col gap-3 border-b border-[var(--line-subtle)] pb-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-[1.35rem] font-semibold text-[var(--text-primary)]">{title}</h2>
          {description ? <p className="text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}
