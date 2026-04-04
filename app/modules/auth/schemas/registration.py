from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UniversityRegistrationRequest(BaseModel):
  code: str = Field(max_length=50)
  name: str = Field(max_length=255)
  email: EmailStr
  password: str = Field(min_length=8, max_length=128)
  public_key: str | None = None


class CompanyRegistrationRequest(BaseModel):
  company_name: str = Field(max_length=255)
  email: EmailStr
  password: str = Field(min_length=8, max_length=128)


class StudentRegistrationRequest(BaseModel):
  email: EmailStr
  password: str = Field(min_length=8, max_length=128)
  last_name: str = Field(max_length=100)
  first_name: str = Field(max_length=100)
  patronymic: str | None = Field(default=None, max_length=100)
  diploma_number: str = Field(max_length=50)


class RegistrationResponse(BaseModel):
  message: str = "Регистрация успешна. Дождитесь подтверждения от администрации."
  user_id: UUID
  is_verified: bool = False
