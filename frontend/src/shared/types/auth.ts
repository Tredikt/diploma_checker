export const userRoles = ['university', 'student', 'company'] as const

export type UserRole = (typeof userRoles)[number]

export interface BackendErrorPayload {
  error_code?: string
  detail?: string
}

export interface SessionState {
  accessToken: string | null
  userId: string | null
  role: UserRole | null
  isAuthenticated: boolean
  pendingRole: UserRole | null
  isBootstrapping: boolean
  profile: UserProfile | null
}

export interface LoginPayload {
  email: string
  password: string
  user_type: UserRole
}

export interface LoginResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  user_id: string
  user_type: UserRole
}

export interface RefreshResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
}

export interface UniversityRegistrationPayload {
  code: string
  name: string
  email: string
  password: string
  public_key: string | null
}

export interface CompanyRegistrationPayload {
  company_name: string
  email: string
  password: string
}

export interface StudentRegistrationPayload {
  email: string
  password: string
  last_name: string
  first_name: string
  patronymic: string | null
  diploma_number: string
}

export interface RegistrationResponse {
  message: string
  user_id: string
  is_verified: boolean
}

interface BaseProfile {
  id: string
  email: string
  created_at: string
}

export interface UniversityProfile extends BaseProfile {
  role: 'university'
  code: string
  name: string
  public_key: string | null
  is_verified: boolean
}

export interface CompanyProfile extends BaseProfile {
  role: 'company'
  company_name: string
  is_verified: boolean
}

export interface StudentProfile extends BaseProfile {
  role: 'student'
  last_name: string
  first_name: string
  patronymic: string | null
}

export type UserProfile = UniversityProfile | CompanyProfile | StudentProfile
