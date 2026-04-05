interface LoadingStateProps {
  title?: string
  description?: string
}

export function LoadingState({
  title = 'Загрузка данных',
  description = 'Подготавливаем данные и интерфейс.',
}: LoadingStateProps) {
  return (
    <div className="shell-page flex min-h-screen items-center justify-center py-12">
      <div className="glass-panel w-full max-w-xl rounded-[32px] p-8 text-center">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-[var(--accent-soft)] border-t-[var(--accent)]" />
        <h1 className="mt-6 text-2xl font-semibold text-[var(--text-primary)]">{title}</h1>
        <p className="muted-copy mt-3 text-base">{description}</p>
      </div>
    </div>
  )
}
