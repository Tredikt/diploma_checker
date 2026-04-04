from __future__ import annotations

import uuid
from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

from app.shared.types.auth import UserTypeEnum


class DiplomaStatus(StrEnum):
    VALID = "VALID"
    REVOKED = "REVOKED"


class SearchRequest(BaseModel):
  university_code: str = Field(min_length=3, max_length=50)
  diploma_number: str = Field(min_length=5, max_length=50)


class DiplomaDataMasked(BaseModel):
  status: str
  university_name: str
  full_name_masked: str
  specialty: str
  issue_year: int


class DiplomaDataFull(BaseModel):
  status: str
  university_name: str
  full_name: str
  specialty: str
  issue_year: int
  diploma_number: str
  verification_timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class VerificationResult(BaseModel):
  model_config = ConfigDict(extra="forbid")

  is_valid: bool
  message: str
  data: DiplomaDataMasked | DiplomaDataFull


class CachedDiplomaRecord(BaseModel):
    diploma_id: uuid.UUID
    status: DiplomaStatus
    expires_at: datetime
    version: int

    @property
    def remaining_seconds(self) -> int:
        expires = self.expires_at if self.expires_at.tzinfo else self.expires_at.replace(tzinfo=UTC)
        delta = expires - datetime.now(UTC)
        return max(int(delta.total_seconds()), 0)

    @property
    def is_valid(self) -> bool:
        return self.status == DiplomaStatus.VALID and self.remaining_seconds > 0


class HrCallerContext(BaseModel):
    auth_mode: str
    principal_id: str | None = None
    company_id: str | None = None
    user_type: UserTypeEnum | None = None
    can_view_full_data: bool


class HrDiplomaRecord(BaseModel):
    diploma_id: uuid.UUID
    university_name: str
    encrypted_payload: str
    status: DiplomaStatus
    expires_at: datetime
    is_revoked: bool = False

    @property
    def remaining_seconds(self) -> int:
        expires = self.expires_at if self.expires_at.tzinfo else self.expires_at.replace(tzinfo=UTC)
        delta = expires - datetime.now(UTC)
        return max(int(delta.total_seconds()), 0)

    @property
    def is_valid(self) -> bool:
        if self.is_revoked:
            return False
        return self.status == DiplomaStatus.VALID and self.remaining_seconds > 0
