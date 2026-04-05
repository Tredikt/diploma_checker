import { apiRequest } from '@/shared/api/http-client'
import type {
  CompanyApiKeyListItem,
  CompanyApiKeyListResponse,
  CompanyLimitsResponse,
  CompanyVerificationResult,
  CompanyVerificationSearchPayload,
  CreateCompanyApiKeyPayload,
  CreateCompanyApiKeyResponse,
} from '@/shared/types/company'

interface PaginationParams {
  limit: number
  offset: number
}

interface RawCompanyApiKeyListResponse {
  items?: unknown
  total?: unknown
  limit?: unknown
  offset?: unknown
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asNullableString(value: unknown) {
  return typeof value === 'string' ? value : null
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeApiKeyItem(value: unknown, index: number): CompanyApiKeyListItem {
  const item = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}

  return {
    id: asString(item.id, `api-key-${index}`),
    key_label: asNullableString(item.key_label),
    key: asNullableString(item.key),
    is_active: asBoolean(item.is_active, true),
    created_at: asString(item.created_at),
    last_used_at: asNullableString(item.last_used_at),
  }
}

function normalizeApiKeyListResponse(payload: unknown, limit: number, offset: number): CompanyApiKeyListResponse {
  if (Array.isArray(payload)) {
    const items = payload.map(normalizeApiKeyItem)

    return {
      items,
      total: items.length,
      limit,
      offset,
    }
  }

  const response = typeof payload === 'object' && payload !== null ? payload as RawCompanyApiKeyListResponse : {}
  const rawItems = Array.isArray(response.items) ? response.items : []
  const items = rawItems.map(normalizeApiKeyItem)

  return {
    items,
    total: asNumber(response.total, items.length),
    limit: asNumber(response.limit, limit),
    offset: asNumber(response.offset, offset),
  }
}

function normalizeCreateApiKeyResponse(payload: unknown): CreateCompanyApiKeyResponse {
  const response = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : {}

  return {
    id: asString(response.id, crypto.randomUUID()),
    key_label: asNullableString(response.key_label),
    key: asString(response.key, asString(response.api_key)),
    is_active: asBoolean(response.is_active, true),
    created_at: asString(response.created_at, new Date().toISOString()),
  }
}

function normalizeLimitsResponse(payload: unknown): CompanyLimitsResponse {
  const response = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : {}

  return {
    company_id: asString(response.company_id, ''),
    monthly_quota: asNumber(response.monthly_quota, asNumber(response.monthly_limit)),
    current_month_usage: asNumber(response.current_month_usage, asNumber(response.used)),
    last_reset_date: asString(response.last_reset_date, asString(response.reset_at)),
    quota_percentage_used: asNumber(response.quota_percentage_used, 0),
  }
}

export function searchCompanyDiploma(payload: CompanyVerificationSearchPayload) {
  return apiRequest<CompanyVerificationResult>('/hr/search', {
    method: 'POST',
    auth: true,
    body: payload,
  })
}

export async function getCompanyApiKeys({ limit, offset }: PaginationParams) {
  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })

  const payload = await apiRequest<unknown>(`/auth/companies/api-keys?${searchParams.toString()}`, {
    auth: true,
  })

  return normalizeApiKeyListResponse(payload, limit, offset)
}

export async function createCompanyApiKey(payload: CreateCompanyApiKeyPayload) {
  const response = await apiRequest<unknown>('/auth/companies/api-keys', {
    method: 'POST',
    auth: true,
    body: payload,
  })

  return normalizeCreateApiKeyResponse(response)
}

export function revokeCompanyApiKey(keyId: string) {
  return apiRequest<void>(`/auth/companies/api-keys/${keyId}`, {
    method: 'DELETE',
    auth: true,
  })
}

export async function getCompanyLimits() {
  const response = await apiRequest<unknown>('/auth/companies/limits', {
    auth: true,
  })

  return normalizeLimitsResponse(response)
}
