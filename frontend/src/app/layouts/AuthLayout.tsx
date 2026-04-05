import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="shell-page min-h-screen py-6 md:py-10">
      <div className="grid min-h-[calc(100vh-3rem)] gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        <section className="glass-panel relative overflow-hidden rounded-[36px] px-6 py-7 md:px-9 md:py-9">
          <div className="auth-orbit auth-orbit-primary" />
          <div className="auth-orbit auth-orbit-secondary" />

          <div className="relative flex h-full flex-col">
            <div className="eyebrow">Diasoft Diploma Verification</div>
            <div className="mt-8 max-w-2xl space-y-4 md:mt-12">
              <h1 className="display-title max-w-[10ch]">Проверка дипломов.</h1>
              <p className="muted-copy max-w-md text-base">Корпоративный контур для ВУЗа, студента и HR.</p>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[36px] p-6 md:p-8">
          <Outlet />
        </section>
      </div>
    </div>
  )
}
