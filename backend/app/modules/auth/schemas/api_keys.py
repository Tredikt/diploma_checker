from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ApiKeyCreateRequest(BaseModel):
  key_label: str | None = Field(default=None, max_length=100)


class ApiKeyResponse(BaseModel):
  id: UUID
  key_label: str | None = None
  key: str | None = None
  is_active: bool
  created_at: datetime
  last_used_at: datetime | None = None


class ApiKeyList(BaseModel):
  items: list[ApiKeyResponse]
  total: int
  limit: int
  offset: int


class CompanyLimitsResponse(BaseModel):
  company_id: UUID
  monthly_quota: int
  current_month_usage: int
  last_reset_date: datetime
  quota_percentage_used: float
