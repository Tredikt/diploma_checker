from __future__ import annotations

import uuid

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.repositories import AuthRepository
from app.modules.auth.schemas import (
  ApiKeyCreateRequest,
  ApiKeyList,
  ApiKeyResponse,
  CompanyLimitsResponse,
  CompanyProfile,
  CompanyRegistrationRequest,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegistrationResponse,
  StudentProfile,
  StudentRegistrationRequest,
  UniversityProfile,
  UniversityRegistrationRequest,
)
from app.modules.auth.services.company_access_service import CompanyAccessService
from app.modules.auth.services.profile_service import ProfileService
from app.modules.auth.services.registration_service import RegistrationService
from app.modules.auth.services.session_service import SessionService
from app.shared.types.auth import UserTypeEnum


class AuthService:
  def __init__(self, session: AsyncSession, redis: Redis) -> None:
    repository = AuthRepository(session)
    self.registration = RegistrationService(repository)
    self.session = SessionService(repository, redis)
    self.profile = ProfileService(repository)
    self.company_access = CompanyAccessService(repository)

  async def register_university(self, payload: UniversityRegistrationRequest) -> RegistrationResponse:
    return await self.registration.register_university(payload)

  async def register_company(self, payload: CompanyRegistrationRequest) -> RegistrationResponse:
    return await self.registration.register_company(payload)

  async def register_student(self, payload: StudentRegistrationRequest) -> RegistrationResponse:
    return await self.registration.register_student(payload)

  async def login(self, payload: LoginRequest) -> tuple[LoginResponse, str, int]:
    return await self.session.login(payload)

  async def refresh(self, refresh_token: str) -> tuple[RefreshResponse, str, int]:
    return await self.session.refresh(refresh_token)

  async def get_me(
    self,
    user_id: str,
    user_type: UserTypeEnum,
  ) -> UniversityProfile | CompanyProfile | StudentProfile:
    return await self.profile.get_me(user_id=user_id, user_type=user_type)

  async def create_api_key(self, company_id: str, payload: ApiKeyCreateRequest) -> ApiKeyResponse:
    return await self.company_access.create_api_key(company_id=company_id, payload=payload)

  async def list_api_keys(self, company_id: str, limit: int, offset: int) -> ApiKeyList:
    return await self.company_access.list_api_keys(company_id=company_id, limit=limit, offset=offset)

  async def revoke_api_key(self, company_id: str, key_id: uuid.UUID) -> None:
    await self.company_access.revoke_api_key(company_id=company_id, key_id=key_id)

  async def get_company_limits(self, company_id: str) -> CompanyLimitsResponse:
    return await self.company_access.get_company_limits(company_id=company_id)
