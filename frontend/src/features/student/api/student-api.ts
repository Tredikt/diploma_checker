import { useSessionStore } from '@/app/store/session-store'
import { ApiError, apiRequest } from '@/shared/api/http-client'
import type {
  CreateStudentAccessTokenPayload,
  StudentAccessTokenListItem,
  StudentAccessTokenListResponse,
  StudentAccessTokenResponse,
  StudentDiplomaDetail,
  StudentDiplomaListItem,
  StudentDiplomaListResponse,
} from '@/shared/types/student'

interface PaginationParams {
  limit: number
  offset: number
}

interface RawStudentDiplomaListResponse {
  items?: unknown
  total?: unknown
  limit?: unknown
  offset?: unknown
}

interface RawStudentAccessTokenListResponse {
  items?: unknown
  total?: unknown
  limit?: unknown
  offset?: unknown
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asStatus(value: unknown): StudentDiplomaListItem['status'] {
  return value === 'annulled' ? 'annulled' : 'valid'
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

export function buildStudentShareUrl(tokenValue: string) {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return `/verify/${tokenValue}`
  }

  return `${window.location.origin}/verify/${tokenValue}`
}

export function getStudentAccessTokenStatus(expiresAt: string, isRevoked: boolean): StudentAccessTokenListItem['status'] {
  if (isRevoked) {
    return 'revoked'
  }

  const timestamp = new Date(expiresAt).getTime()

  if (Number.isFinite(timestamp) && timestamp <= Date.now()) {
    return 'expired'
  }

  return 'active'
}

function normalizeStudentDiplomaItem(value: unknown, index: number): StudentDiplomaListItem {
  const item = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

  return {
    id: asString(item.id, `student-diploma-${index}`),
    verification_hash: asString(item.verification_hash),
    graduation_year: asNumber(item.graduation_year),
    status: asStatus(item.status),
  }
}

function normalizeStudentDiplomaListResponse(payload: unknown, limit: number, offset: number): StudentDiplomaListResponse {
  const response = typeof payload === 'object' && payload !== null ? (payload as RawStudentDiplomaListResponse) : {}
  const rawItems = Array.isArray(response.items) ? response.items : []
  const items = rawItems.map(normalizeStudentDiplomaItem)

  return {
    items,
    total: asNumber(response.total, items.length),
    limit: asNumber(response.limit, limit),
    offset: asNumber(response.offset, offset),
  }
}

function normalizeStudentDiplomaDetail(payload: unknown): StudentDiplomaDetail {
  const response = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {}

  return {
    id: asString(response.id),
    verification_hash: asString(response.verification_hash),
    graduation_year: asNumber(response.graduation_year),
    status: asStatus(response.status),
    full_name: asString(response.full_name),
    specialty: asString(response.specialty),
    diploma_number: asString(response.diploma_number),
  }
}

function normalizeStudentAccessTokenItem(value: unknown, index: number): StudentAccessTokenListItem {
  const item = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  const tokenValue = asString(item.token_value, `student-token-${index}`)
  const expiresAt = asString(item.expires_at)
  const isRevoked = asBoolean(item.is_revoked)

  return {
    id: asString(item.id, `student-token-${index}`),
    token_value: tokenValue,
    share_url: asString(item.share_url, buildStudentShareUrl(tokenValue)),
    expires_at: expiresAt,
    created_at: asString(item.created_at),
    is_revoked: isRevoked,
    status: getStudentAccessTokenStatus(expiresAt, isRevoked),
  }
}

function normalizeStudentAccessTokenListResponse(payload: unknown, limit: number, offset: number): StudentAccessTokenListResponse {
  const response = typeof payload === 'object' && payload !== null ? (payload as RawStudentAccessTokenListResponse) : {}
  const rawItems = Array.isArray(response.items) ? response.items : []
  const items = rawItems.map(normalizeStudentAccessTokenItem)

  return {
    items,
    total: asNumber(response.total, items.length),
    limit: asNumber(response.limit, limit),
    offset: asNumber(response.offset, offset),
  }
}

function normalizeStudentAccessTokenResponse(payload: unknown): StudentAccessTokenResponse {
  const response = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {}
  const tokenValue = asString(response.token_value)
  const expiresAt = asString(response.expires_at)
  const isRevoked = asBoolean(response.is_revoked)

  return {
    id: asString(response.id),
    diploma_id: asString(response.diploma_id),
    token_value: tokenValue,
    share_url: asString(response.share_url, buildStudentShareUrl(tokenValue)),
    expires_at: expiresAt,
    created_at: asString(response.created_at),
    is_revoked: isRevoked,
    status: getStudentAccessTokenStatus(expiresAt, isRevoked),
  }
}

export async function getStudentDiplomas({ limit, offset }: PaginationParams) {
  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })

  const payload = await apiRequest<unknown>(`/student/diplomas?${searchParams.toString()}`, {
    auth: true,
  })

  return normalizeStudentDiplomaListResponse(payload, limit, offset)
}

export async function getStudentDiplomaDetail(diplomaId: string) {
  const payload = await apiRequest<unknown>(`/student/diplomas/${diplomaId}`, {
    auth: true,
  })

  return normalizeStudentDiplomaDetail(payload)
}

export async function createStudentAccessToken(payload: CreateStudentAccessTokenPayload) {
  const response = await apiRequest<unknown>('/student/access-tokens', {
    method: 'POST',
    auth: true,
    body: payload,
  })

  return normalizeStudentAccessTokenResponse(response)
}

export async function getStudentAccessTokens({ diplomaId, limit, offset }: PaginationParams & { diplomaId: string }) {
  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })

  const payload = await apiRequest<unknown>(`/student/diplomas/${diplomaId}/access-tokens?${searchParams.toString()}`, {
    auth: true,
  })

  return normalizeStudentAccessTokenListResponse(payload, limit, offset)
}

export async function revokeStudentAccessToken(tokenId: string) {
  return apiRequest<unknown>(`/student/access-tokens/${tokenId}/revoke`, {
    method: 'POST',
    auth: true,
  })
}

export async function getStudentAccessTokenQr(tokenId: string) {
  const { accessToken } = useSessionStore.getState()
  const response = await fetch(`/api/v1/student/access-tokens/${tokenId}/qr`, {
    method: 'GET',
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new ApiError('QR request failed', response.status, payload)
  }

  return response.blob()
}
