import type { PropsWithChildren, ReactNode } from 'react'

interface PageSectionProps extends PropsWithChildren {
  eyebrow?: string
  title: string
  description?: string
  aside?: ReactNode
}

export function PageSection({ eyebrow, title, description, aside, children }: PageSectionProps) {
  return (
    <section className="glass-panel rounded-[28px] p-5 md:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-2.5">
          {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
          <h1 className="section-title text-[var(--text-primary)]">{title}</h1>
          {description ? <p className="muted-copy max-w-xl text-[0.96rem]">{description}</p> : null}
        </div>
        {aside ? <div className="min-w-[220px] lg:max-w-[320px]">{aside}</div> : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  )
}
