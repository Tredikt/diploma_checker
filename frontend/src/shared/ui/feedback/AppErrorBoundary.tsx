import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

import { ErrorState } from '@/shared/ui/states/ErrorState'

interface State {
  hasError: boolean
  error: Error | null
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  public override state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught an error', error, errorInfo)
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="Интерфейс временно недоступен"
          description={this.state.error?.message ?? 'Произошла непредвиденная ошибка.'}
          actionLabel="Перезагрузить страницу"
          onAction={() => window.location.reload()}
        />
      )
    }

    return this.props.children
  }
}
