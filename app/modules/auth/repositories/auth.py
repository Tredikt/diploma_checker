from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import ApiKey, Company, CompanyLimit, Student, University
from app.modules.auth.repositories.api_keys import ApiKeyRepository
from app.modules.auth.repositories.diploma_claims import DiplomaClaimRepository
from app.modules.auth.repositories.limits import CompanyLimitRepository
from app.modules.auth.repositories.users import UserEntity, UserRepository
from app.shared.types.auth import UserTypeEnum


class AuthRepository:
  def __init__(self, session: AsyncSession) -> None:
    self.users = UserRepository(session)
    self.diploma_claims = DiplomaClaimRepository(session)
    self.api_keys = ApiKeyRepository(session)
    self.limits = CompanyLimitRepository(session)

  async def create_university(
    self,
    code: str,
    name: str,
    email: str,
    password_hash: str,
    public_key: str | None,
  ) -> University:
    return await self.users.create_university(code, name, email, password_hash, public_key)

  async def create_company(self, company_name: str, email: str, password_hash: str) -> Company:
    return await self.users.create_company(company_name, email, password_hash)

  async def create_student(
    self,
    email: str,
    password_hash: str,
    encrypted_last_name: str,
    encrypted_first_name: str,
    encrypted_patronymic: str | None,
  ) -> Student:
    return await self.users.create_student(
      email,
      password_hash,
      encrypted_last_name,
      encrypted_first_name,
      encrypted_patronymic,
    )

  async def claim_diploma_for_student(
    self,
    student_id: uuid.UUID,
    last_name_hash: str,
    first_name_hash: str,
    patronymic_hash: str | None,
    diploma_number_hash: str,
  ) -> bool:
    return await self.diploma_claims.claim_diploma_for_student(
      student_id=student_id,
      last_name_hash=last_name_hash,
      first_name_hash=first_name_hash,
      patronymic_hash=patronymic_hash,
      diploma_number_hash=diploma_number_hash,
    )

  async def get_user_by_email(self, email: str, user_type: UserTypeEnum) -> UserEntity | None:
    return await self.users.get_user_by_email(email, user_type)

  async def get_user_by_id(
    self,
    user_id: uuid.UUID,
    user_type: UserTypeEnum,
  ) -> UserEntity | None:
    return await self.users.get_user_by_id(user_id, user_type)

  async def create_api_key(self, company_id: uuid.UUID, key_hash: str, key_label: str | None) -> ApiKey:
    return await self.api_keys.create_api_key(company_id, key_hash, key_label)

  async def list_api_keys(self, company_id: uuid.UUID, limit: int, offset: int) -> tuple[list[ApiKey], int]:
    return await self.api_keys.list_api_keys(company_id, limit, offset)

  async def deactivate_api_key(self, company_id: uuid.UUID, key_id: uuid.UUID) -> bool:
    return await self.api_keys.deactivate_api_key(company_id, key_id)

  async def get_or_create_company_limit(self, company_id: uuid.UUID) -> CompanyLimit:
    return await self.limits.get_or_create_company_limit(company_id)
