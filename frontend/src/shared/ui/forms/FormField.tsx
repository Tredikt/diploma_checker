import type { InputHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  adornment?: ReactNode
}

export function FormField({ adornment, className, label, error, hint, id, ...props }: FormFieldProps) {
  const fieldId = id ?? props.name

  return (
    <label className="block space-y-2" htmlFor={fieldId}>
      <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
      <div
        className={cn(
          'flex items-center gap-3 rounded-[20px] border bg-white/80 px-4 py-3 transition',
          error ? 'border-[rgba(178,79,67,0.4)]' : 'border-[var(--line-subtle)] focus-within:border-[var(--accent)]',
          className,
        )}
      >
        {adornment ? <span className="text-sm font-semibold text-[var(--text-muted)]">{adornment}</span> : null}
        <input
          className="w-full border-none bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          id={fieldId}
          {...props}
        />
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : hint ? <p className="text-sm text-[var(--text-muted)]">{hint}</p> : null}
    </label>
  )
}
