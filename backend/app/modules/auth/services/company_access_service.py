from __future__ import annotations

import secrets
import uuid

from sqlalchemy.exc import IntegrityError

from app.modules.auth.repositories import AuthRepository
from app.modules.auth.schemas import ApiKeyCreateRequest, ApiKeyList, ApiKeyResponse, CompanyLimitsResponse
from app.shared.cryptography import hash_token
from app.shared.errors import AppError


class CompanyAccessService:
  def __init__(self, repository: AuthRepository) -> None:
    self.repository = repository

  async def create_api_key(self, company_id: str, payload: ApiKeyCreateRequest) -> ApiKeyResponse:
    plain_key = f"dsf_{secrets.token_urlsafe(32)}"
    key_hash = hash_token(plain_key)

    try:
      key = await self.repository.create_api_key(
        company_id=uuid.UUID(company_id),
        key_hash=key_hash,
        key_label=payload.key_label,
      )
    except IntegrityError as exc:
      raise AppError(status_code=409, error_code="CONFLICT", detail="API key conflict") from exc

    return ApiKeyResponse(
      id=key.id,
      key_label=key.key_label,
      key=plain_key,
      is_active=key.is_active,
      created_at=key.created_at,
    )

  async def list_api_keys(self, company_id: str, limit: int, offset: int) -> ApiKeyList:
    items, total = await self.repository.list_api_keys(uuid.UUID(company_id), limit=limit, offset=offset)
    mapped = [
      ApiKeyResponse(
        id=item.id,
        key_label=item.key_label,
        key=None,
        is_active=item.is_active,
        created_at=item.created_at,
        last_used_at=item.last_used_at,
      )
      for item in items
    ]
    return ApiKeyList(items=mapped, total=total, limit=limit, offset=offset)

  async def revoke_api_key(self, company_id: str, key_id: uuid.UUID) -> None:
    updated = await self.repository.deactivate_api_key(uuid.UUID(company_id), key_id)
    if not updated:
      raise AppError(status_code=404, error_code="NOT_FOUND", detail="API key not found")

  async def get_company_limits(self, company_id: str) -> CompanyLimitsResponse:
    limit = await self.repository.get_or_create_company_limit(uuid.UUID(company_id))
    quota_percentage_used = 0.0
    if limit.monthly_quota > 0:
      quota_percentage_used = (limit.current_month_usage / limit.monthly_quota) * 100.0

    return CompanyLimitsResponse(
      company_id=limit.company_id,
      monthly_quota=limit.monthly_quota,
      current_month_usage=limit.current_month_usage,
      last_reset_date=limit.last_reset_date,
      quota_percentage_used=round(quota_percentage_used, 2),
    )
