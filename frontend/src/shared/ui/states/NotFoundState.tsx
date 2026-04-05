import { Link } from 'react-router-dom'

export function NotFoundState() {
  return (
    <div className="shell-page flex min-h-screen items-center justify-center py-12">
      <div className="glass-panel w-full max-w-2xl rounded-[32px] p-8 md:p-10">
        <div className="eyebrow">404</div>
        <h1 className="display-title mt-4">Маршрут не найден</h1>
        <p className="muted-copy mt-5 max-w-xl">Проверьте адрес страницы или вернитесь в рабочий контур.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-full bg-[var(--bg-ink)] px-5 py-3 text-sm font-semibold text-white" to="/auth/login">
            На вход
          </Link>
        </div>
      </div>
    </div>
  )
}
