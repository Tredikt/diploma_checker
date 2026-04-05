import '@/shared/design-tokens/theme.css'

import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouterProvider } from '@/app/router/AppRouterProvider'
import { useAuthBootstrap } from '@/app/bootstrap/useAuthBootstrap'

function BootstrapRuntime() {
  useAuthBootstrap()

  return <AppRouterProvider />
}

export function AppBootstrap() {
  return (
    <AppProviders>
      <BootstrapRuntime />
    </AppProviders>
  )
}
