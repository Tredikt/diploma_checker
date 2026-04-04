from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class StudentDiplomaListItem(BaseModel):
  id: UUID
  verification_hash: str
  graduation_year: int
  status: Literal["valid", "annulled"]


class StudentDiplomaListResponse(BaseModel):
  items: list[StudentDiplomaListItem]
  total: int
  limit: int
  offset: int


class StudentDiplomaDetailResponse(BaseModel):
  id: UUID
  verification_hash: str
  graduation_year: int
  status: Literal["valid", "annulled"]
  full_name: str
  specialty: str
  diploma_number: str


class CreateAccessTokenRequest(BaseModel):
  diploma_id: UUID
  ttl_days: int = Field(default=7, ge=1, le=90)


class AccessTokenResponse(BaseModel):
  id: UUID
  diploma_id: UUID
  token_value: str
  share_url: str
  expires_at: datetime
  is_revoked: bool
  created_at: datetime


class AccessTokenListItem(BaseModel):
  id: UUID
  token_value: str
  expires_at: datetime
  is_revoked: bool
  created_at: datetime


class AccessTokenListResponse(BaseModel):
  items: list[AccessTokenListItem]
  total: int
  limit: int
  offset: int


class RevokeAccessTokenResponse(BaseModel):
  id: UUID
  is_revoked: bool
