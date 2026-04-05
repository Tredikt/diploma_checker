interface ResultBannerProps {
  title: string
  description: string
  tone?: 'success' | 'info' | 'warning'
}

const toneClasses = {
  success: 'border-[rgba(45,122,87,0.2)] bg-[rgba(45,122,87,0.08)]',
  info: 'border-[rgba(196,109,56,0.18)] bg-[rgba(196,109,56,0.08)]',
  warning: 'border-[rgba(178,79,67,0.2)] bg-[rgba(178,79,67,0.08)]',
}

export function ResultBanner({ title, description, tone = 'info' }: ResultBannerProps) {
  return (
    <div className={['rounded-[24px] border p-4 shadow-[var(--shadow-soft)]', toneClasses[tone]].join(' ')}>
      <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
      <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
    </div>
  )
}
