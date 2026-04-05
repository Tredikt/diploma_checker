export const universityDiplomaStatuses = ['valid', 'annulled'] as const

export type UniversityDiplomaStatus = (typeof universityDiplomaStatuses)[number]

export interface UniversityDiplomaListItem {
  id: string
  verification_hash: string
  graduation_year: number
  status: UniversityDiplomaStatus
}

export interface UniversityDiplomaListResponse {
  items: UniversityDiplomaListItem[]
  total: number
  limit: number
  offset: number
}

export interface UniversityDiplomaDetail {
  id: string
  verification_hash: string
  graduation_year: number
  status: UniversityDiplomaStatus
  full_name: string
  specialty: string
  diploma_number: string
}

export interface CreateUniversityDiplomaPayload {
  full_name: string
  year: number
  specialty: string
  diploma_number: string
}

export interface CreateUniversityDiplomaResponse {
  id: string
  verification_hash: string
  status: UniversityDiplomaStatus
}

export interface UniversityImportError {
  row_number: number
  detail: string
}

export interface ImportUniversityDiplomasResponse {
  created: number
  errors: UniversityImportError[]
}

export interface RevokeUniversityDiplomaResponse {
  verification_hash: string
  status: UniversityDiplomaStatus
}
