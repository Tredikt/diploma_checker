export const studentDiplomaStatuses = ['valid', 'annulled'] as const
export const studentAccessTokenStatuses = ['active', 'revoked', 'expired'] as const

export type StudentDiplomaStatus = (typeof studentDiplomaStatuses)[number]
export type StudentAccessTokenStatus = (typeof studentAccessTokenStatuses)[number]

export interface StudentDiplomaListItem {
  id: string
  verification_hash: string
  graduation_year: number
  status: StudentDiplomaStatus
}

export interface StudentDiplomaListResponse {
  items: StudentDiplomaListItem[]
  total: number
  limit: number
  offset: number
}

export interface StudentDiplomaDetail {
  id: string
  verification_hash: string
  graduation_year: number
  status: StudentDiplomaStatus
  full_name: string
  specialty: string
  diploma_number: string
}

export interface StudentAccessTokenListItem {
  id: string
  token_value: string
  share_url: string
  expires_at: string
  created_at: string
  is_revoked: boolean
  status: StudentAccessTokenStatus
}

export interface StudentAccessTokenListResponse {
  items: StudentAccessTokenListItem[]
  total: number
  limit: number
  offset: number
}

export interface StudentAccessTokenResponse {
  id: string
  diploma_id: string
  token_value: string
  share_url: string
  expires_at: string
  created_at: string
  is_revoked: boolean
  status: StudentAccessTokenStatus
}

export interface CreateStudentAccessTokenPayload {
  diploma_id: string
  ttl_days?: number
}
