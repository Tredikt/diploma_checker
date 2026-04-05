export interface DiplomaDataMasked {
  status: string
  university_name: string
  full_name_masked: string
  specialty: string
  issue_year: number
}

export interface DiplomaDataFull {
  status: string
  university_name: string
  full_name: string
  specialty: string
  issue_year: number
  diploma_number: string
  verification_timestamp: string
}

export interface VerificationResult {
  is_valid: boolean
  message: string
  data: DiplomaDataMasked | DiplomaDataFull
}
