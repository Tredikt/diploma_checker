import { useSessionStore } from '@/app/store/session-store'
import type { BackendErrorPayload } from '@/shared/types/auth'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  auth?: boolean
}

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData
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
  const normalizedHeaders = {
    ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(isFormDataBody(body) ? {} : { 'Content-Type': 'application/json' }),
    ...(headers ?? {}),
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...rest,
    headers: normalizedHeaders,
    body: body === undefined ? undefined : isFormDataBody(body) ? body : JSON.stringify(body),
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
