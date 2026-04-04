import { useSessionStore } from '@/app/store/session-store'
import type { BackendErrorPayload } from '@/shared/types/auth'

const API_BASE_URL = '/api/v1'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  auth?: boolean
}

export class ApiError extends Error {
  public readonly status: number
  public readonly payload: unknown
  public readonly errorCode?: string
  public readonly detail?: string

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
    const normalized = isBackendErrorPayload(payload) ? payload : null
    this.errorCode = normalized?.error_code
    this.detail = normalized?.detail
  }
}

function isBackendErrorPayload(payload: unknown): payload is BackendErrorPayload {
  return typeof payload === 'object' && payload !== null
}

export function getApiErrorMessage(error: unknown, fallback = 'Не удалось выполнить запрос. Попробуйте ещё раз.') {
  if (error instanceof ApiError) {
    return error.detail ?? error.errorCode ?? fallback
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken } = useSessionStore.getState()
  const { auth = false, body, headers, ...rest } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const normalized = isBackendErrorPayload(payload) ? payload : null
    throw new ApiError(normalized?.detail ?? 'API request failed', response.status, payload)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
