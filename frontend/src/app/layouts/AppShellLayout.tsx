import type { PropsWithChildren } from 'react'

import { AppShell } from '@/widgets/app-shell/AppShell'

export function AppShellLayout({ children }: PropsWithChildren) {
  return <AppShell>{children}</AppShell>
}
