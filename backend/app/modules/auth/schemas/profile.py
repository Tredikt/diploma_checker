from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class UniversityProfile(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: UUID
  code: str
  name: str
  email: EmailStr
  public_key: str | None
  is_verified: bool
  created_at: datetime


class CompanyProfile(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: UUID
  company_name: str
  email: EmailStr
  is_verified: bool
  created_at: datetime


class StudentProfile(BaseModel):
  id: UUID
  email: EmailStr
  last_name: str
  first_name: str
  patronymic: str | None
  created_at: datetime
