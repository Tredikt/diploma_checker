interface FormMessageProps {
  tone?: 'error' | 'success' | 'info'
  message: string
}

const toneClasses = {
  error: 'border-[rgba(178,79,67,0.24)] bg-[rgba(178,79,67,0.08)] text-[var(--danger)]',
  success: 'border-[rgba(45,122,87,0.24)] bg-[rgba(45,122,87,0.08)] text-[var(--success)]',
  info: 'border-[var(--line-subtle)] bg-white/70 text-[var(--text-secondary)]',
}

export function FormMessage({ tone = 'info', message }: FormMessageProps) {
  return <div className={`rounded-[20px] border px-4 py-3 text-sm leading-6 ${toneClasses[tone]}`}>{message}</div>
}
