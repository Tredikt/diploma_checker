from __future__ import annotations

import uuid
from typing import cast

from app.modules.auth.models import Student
from app.modules.auth.repositories import AuthRepository
from app.modules.auth.schemas import CompanyProfile, StudentProfile, UniversityProfile
from app.shared.cryptography import decrypt_aes
from app.shared.errors import AppError
from app.shared.types.auth import UserTypeEnum


class ProfileService:
  def __init__(self, repository: AuthRepository) -> None:
    self.repository = repository

  async def get_me(
    self,
    user_id: str,
    user_type: UserTypeEnum,
  ) -> UniversityProfile | CompanyProfile | StudentProfile:
    parsed_user_id = uuid.UUID(user_id)
    user = await self.repository.get_user_by_id(parsed_user_id, user_type)
    if user is None:
      raise AppError(status_code=404, error_code="NOT_FOUND", detail="User not found")

    if user_type is UserTypeEnum.UNIVERSITY:
      return UniversityProfile.model_validate(user)
    if user_type is UserTypeEnum.COMPANY:
      return CompanyProfile.model_validate(user)

    student = cast(Student, user)
    return StudentProfile(
      id=student.id,
      email=student.email,
      last_name=decrypt_aes(student.encrypted_last_name),
      first_name=decrypt_aes(student.encrypted_first_name),
      patronymic=decrypt_aes(student.encrypted_patronymic) if student.encrypted_patronymic else None,
      created_at=student.created_at,
    )
