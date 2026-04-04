from __future__ import annotations

from sqlalchemy.exc import IntegrityError

from app.modules.auth.repositories import AuthRepository
from app.modules.auth.schemas import (
  CompanyRegistrationRequest,
  RegistrationResponse,
  StudentRegistrationRequest,
  UniversityRegistrationRequest,
)
from app.shared.cryptography import compute_hmac, encrypt_aes, hash_password
from app.shared.errors import AppError


class RegistrationService:
  def __init__(self, repository: AuthRepository) -> None:
    self.repository = repository

  async def register_university(self, payload: UniversityRegistrationRequest) -> RegistrationResponse:
    try:
      user = await self.repository.create_university(
        code=payload.code,
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        public_key=payload.public_key,
      )
    except IntegrityError as exc:
      raise AppError(status_code=409, error_code="CONFLICT", detail="University already exists") from exc

    return RegistrationResponse(user_id=user.id, is_verified=user.is_verified)

  async def register_company(self, payload: CompanyRegistrationRequest) -> RegistrationResponse:
    try:
      user = await self.repository.create_company(
        company_name=payload.company_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
      )
    except IntegrityError as exc:
      raise AppError(status_code=409, error_code="CONFLICT", detail="Company already exists") from exc

    return RegistrationResponse(user_id=user.id, is_verified=user.is_verified)

  async def register_student(self, payload: StudentRegistrationRequest) -> RegistrationResponse:
    try:
      student = await self.repository.create_student(
        email=payload.email,
        password_hash=hash_password(payload.password),
        encrypted_last_name=encrypt_aes(payload.last_name),
        encrypted_first_name=encrypt_aes(payload.first_name),
        encrypted_patronymic=encrypt_aes(payload.patronymic) if payload.patronymic else None,
      )
    except IntegrityError as exc:
      raise AppError(status_code=409, error_code="CONFLICT", detail="Student already exists") from exc

    claimed = await self.repository.claim_diploma_for_student(
      student_id=student.id,
      last_name_hash=compute_hmac(payload.last_name),
      first_name_hash=compute_hmac(payload.first_name),
      patronymic_hash=compute_hmac(payload.patronymic) if payload.patronymic else None,
      diploma_number_hash=compute_hmac(payload.diploma_number),
    )

    if not claimed:
      raise AppError(
        status_code=409,
        error_code="CONFLICT",
        detail="Diploma not found or already claimed",
      )

    return RegistrationResponse(user_id=student.id, is_verified=True)
