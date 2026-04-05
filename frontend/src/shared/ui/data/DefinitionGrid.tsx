import type { ReactNode } from 'react'

interface DefinitionItem {
  label: string
  value: ReactNode
}

interface DefinitionGridProps {
  items: DefinitionItem[]
}

export function DefinitionGrid({ items }: DefinitionGridProps) {
  return (
    <dl className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div className="rounded-[22px] border border-[var(--line-subtle)] bg-white/60 p-4" key={item.label}>
          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{item.label}</dt>
          <dd className="mt-2 min-w-0 text-base font-semibold text-[var(--text-primary)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
