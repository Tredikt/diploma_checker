import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

import { createAppQueryClient } from '@/app/providers/query-client'
import { AppErrorBoundary } from '@/shared/ui/feedback/AppErrorBoundary'

const queryClient = createAppQueryClient()

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AppErrorBoundary>
  )
}
