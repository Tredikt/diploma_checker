import { useSessionStore } from '@/app/store/session-store'
import { InfoCard } from '@/shared/ui/feedback/InfoCard'
import { PageSection } from '@/shared/ui/feedback/PageSection'
import { ResultBanner } from '@/shared/ui/feedback/ResultBanner'

export function StudentHomePage() {
  const profile = useSessionStore((state) => state.profile)

  const fullName = profile?.role === 'student' ? [profile.last_name, profile.first_name, profile.patronymic].filter(Boolean).join(' ') : 'Студент'

  return (
    <div className="space-y-6">
      <PageSection
        eyebrow="Student Workspace"
        title="Личный кабинет"
        description="Аккаунт уже активен, а прикладные student-функции будут подключаться по мере готовности backend API."
        aside={
          <InfoCard
            description="Текущий MVP сохраняет единый вход и базовый private shell, не подменяя отсутствующие backend-возможности временными экранами."
            label="Статус"
            title="Shell-only режим"
            tone="accent"
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel rounded-[28px] p-5 md:p-7">
          <div className="eyebrow">Account Summary</div>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{fullName}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {profile?.email ?? 'Email будет отображаться здесь после получения профиля.'}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-[var(--line-subtle)] bg-white/55 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Контур</div>
              <div className="mt-2 text-base font-semibold text-[var(--text-primary)]">Аккаунт активен</div>
            </div>
            <div className="rounded-[20px] border border-[var(--line-subtle)] bg-white/55 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Доступность функций</div>
              <div className="mt-2 text-base font-semibold text-[var(--text-primary)]">Ожидает API</div>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <ResultBanner
            description="Как только backend предоставит student endpoints, этот раздел расширится без смены маршрута и без повторного онбординга."
            title="Личный кабинет уже подготовлен к следующему этапу"
          />
          <div className="rounded-[28px] border border-[var(--line-subtle)] bg-white/55 p-5 shadow-[var(--shadow-soft)] md:p-6">
            <div className="eyebrow">Next Step</div>
            <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Что появится дальше</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              После расширения backend API здесь будут подключены данные по диплому, QR-сценарии и действия по шарингу. До этого момента экран честно показывает только доступный контур аккаунта.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
