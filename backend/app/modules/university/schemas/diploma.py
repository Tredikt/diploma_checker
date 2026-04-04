from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class DiplomaCreateRequest(BaseModel):
  full_name: str = Field(min_length=2, max_length=500)
  year: int = Field(ge=1950, le=2100)
  specialty: str = Field(min_length=1, max_length=500)
  diploma_number: str = Field(min_length=1, max_length=100)


class DiplomaCreatedResponse(BaseModel):
  id: UUID
  verification_hash: str
  status: Literal["valid"]


class DiplomaDetailResponse(BaseModel):
  id: UUID
  verification_hash: str
  graduation_year: int
  status: Literal["valid", "annulled"]
  full_name: str
  specialty: str
  diploma_number: str


class DiplomaListItem(BaseModel):
  id: UUID
  verification_hash: str
  graduation_year: int
  status: Literal["valid", "annulled"]


class DiplomaListResponse(BaseModel):
  items: list[DiplomaListItem]
  total: int
  limit: int
  offset: int


class ImportRowError(BaseModel):
  row_number: int
  detail: str


class DiplomaImportResponse(BaseModel):
  created: int
  errors: list[ImportRowError]


class RevokeDiplomaResponse(BaseModel):
  verification_hash: str
  status: Literal["annulled"]
