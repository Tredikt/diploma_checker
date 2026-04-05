export interface CompanyVerificationSearchPayload {
  university_code: string
  diploma_number: string
}

export interface CompanyVerificationResultData {
  status: string
  university_name: string
  full_name: string
  specialty: string
  issue_year: number
  diploma_number: string
  verification_timestamp: string
}

export interface CompanyVerificationResult {
  is_valid: boolean
  message: string
  data: CompanyVerificationResultData
}

export interface CompanyApiKeyListItem {
  id: string
  key_label: string | null
  key: string | null
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

export interface CompanyApiKeyListResponse {
  items: CompanyApiKeyListItem[]
  total: number
  limit: number
  offset: number
}

export interface CreateCompanyApiKeyPayload {
  key_label: string | null
}

export interface CreateCompanyApiKeyResponse {
  id: string
  key_label: string | null
  key: string
  is_active: boolean
  created_at: string
}

export type RevokeCompanyApiKeyResponse = void

export interface CompanyLimitsResponse {
  company_id: string
  monthly_quota: number
  current_month_usage: number
  last_reset_date: string
  quota_percentage_used: number
}
