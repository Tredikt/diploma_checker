import { apiRequest } from '@/shared/api/http-client'
import type { VerificationResult } from '@/shared/types/verification'

export async function verifyPublicDiploma(token: string) {
  return apiRequest<VerificationResult>(`/hr/verify/${token}`)
}
