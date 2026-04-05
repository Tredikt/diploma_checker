import { apiRequest } from '@/shared/api/http-client'
import type {
  CreateUniversityDiplomaPayload,
  CreateUniversityDiplomaResponse,
  ImportUniversityDiplomasResponse,
  RevokeUniversityDiplomaResponse,
  UniversityDiplomaDetail,
  UniversityDiplomaListResponse,
} from '@/shared/types/university'

interface GetUniversityDiplomasParams {
  limit: number
  offset: number
}

export async function getUniversityDiplomas({ limit, offset }: GetUniversityDiplomasParams) {
  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })

  return apiRequest<UniversityDiplomaListResponse>(`/university/diplomas?${searchParams.toString()}`, {
    auth: true,
  })
}

export function createUniversityDiploma(payload: CreateUniversityDiplomaPayload) {
  return apiRequest<CreateUniversityDiplomaResponse>('/university/diplomas', {
    method: 'POST',
    auth: true,
    body: payload,
  })
}

export function importUniversityDiplomas(file: File) {
  const body = new FormData()
  body.append('file', file)

  return apiRequest<ImportUniversityDiplomasResponse>('/university/diplomas/import', {
    method: 'POST',
    auth: true,
    body,
  })
}

export function getUniversityDiplomaDetail(verificationHash: string) {
  return apiRequest<UniversityDiplomaDetail>(`/university/diplomas/${verificationHash}`, {
    auth: true,
  })
}

export function revokeUniversityDiploma(verificationHash: string) {
  return apiRequest<RevokeUniversityDiplomaResponse>(`/university/diplomas/${verificationHash}/revoke`, {
    method: 'POST',
    auth: true,
  })
}
