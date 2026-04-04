import { apiRequest } from '@/shared/api/http-client'
import type {
  CompanyRegistrationPayload,
  LoginPayload,
  LoginResponse,
  RefreshResponse,
  RegistrationResponse,
  StudentRegistrationPayload,
  UniversityRegistrationPayload,
  UserProfile,
} from '@/shared/types/auth'

export async function login(payload: LoginPayload) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export async function refreshSession() {
  return apiRequest<RefreshResponse>('/auth/refresh', {
    method: 'POST',
  })
}

export async function getMyProfile() {
  const profile = await apiRequest<Record<string, unknown>>('/auth/me', {
    auth: true,
  })

  if ('code' in profile) {
    return { ...(profile as Omit<UserProfile, 'role'>), role: 'university' } as UserProfile
  }

  if ('company_name' in profile) {
    return { ...(profile as Omit<UserProfile, 'role'>), role: 'company' } as UserProfile
  }

  return { ...(profile as Omit<UserProfile, 'role'>), role: 'student' } as UserProfile
}

export async function registerUniversity(payload: UniversityRegistrationPayload) {
  return apiRequest<RegistrationResponse>('/auth/register/university', {
    method: 'POST',
    body: payload,
  })
}

export async function registerCompany(payload: CompanyRegistrationPayload) {
  return apiRequest<RegistrationResponse>('/auth/register/company', {
    method: 'POST',
    body: payload,
  })
}

export async function registerStudent(payload: StudentRegistrationPayload) {
  return apiRequest<RegistrationResponse>('/auth/register/student', {
    method: 'POST',
    body: payload,
  })
}
