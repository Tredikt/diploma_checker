from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, Request, Response
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.repositories import AuthRepository
from app.modules.hr.repositories import HrDiplomaRepository, HrUniversityLookupRepository
from app.modules.hr.services import HrCallerContext, HrVerificationService
from app.shared.cryptography import hash_token
from app.shared.database import get_db
from app.shared.errors import AppError
from app.shared.middleware.auth import CurrentUser, resolve_current_user_from_token
from app.shared.middleware.rate_limiter import api_key_rate_limit, public_rate_limit
from app.shared.redis_client import get_redis
from app.shared.types.auth import UserTypeEnum

DbSessionDep = Annotated[AsyncSession, Depends(get_db)]
RedisDep = Annotated[Redis, Depends(get_redis)]
_optional_bearer = HTTPBearer(
  auto_error=False,
  scheme_name="BearerAuth",
  description="JWT access token for full diploma data access.",
)
_optional_api_key = APIKeyHeader(
  name="x-api-key",
  auto_error=False,
  scheme_name="ApiKeyAuth",
  description="Company API key for HR B2B access.",
)


async def get_hr_caller_context(
  session: DbSessionDep,
  credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_optional_bearer)],
  api_key: Annotated[str | None, Depends(_optional_api_key)],
) -> HrCallerContext:
  if credentials is not None:
    current_user = resolve_current_user_from_token(credentials.credentials)
    return _jwt_user_context(current_user)

  if api_key is not None:
    company_id = await _authenticate_and_consume_api_key(session=session, api_key=api_key)
    return HrCallerContext(
      auth_mode="api_key",
      principal_id=company_id,
      company_id=company_id,
      user_type=UserTypeEnum.COMPANY,
      can_view_full_data=True,
    )

  return HrCallerContext(
    auth_mode="anonymous",
    principal_id=None,
    company_id=None,
    user_type=None,
    can_view_full_data=False,
  )


HrCallerContextDep = Annotated[HrCallerContext, Depends(get_hr_caller_context)]


def _jwt_user_context(current_user: CurrentUser) -> HrCallerContext:
  company_id = current_user.user_id if current_user.user_type is UserTypeEnum.COMPANY else None
  return HrCallerContext(
    auth_mode="jwt",
    principal_id=current_user.user_id,
    company_id=company_id,
    user_type=current_user.user_type,
    can_view_full_data=True,
  )


def get_hr_verification_service(session: AsyncSession, redis: Redis) -> HrVerificationService:
  return HrVerificationService(
    redis=redis,
    diploma_repository=HrDiplomaRepository(session=session),
    university_lookup_repository=HrUniversityLookupRepository(session=session),
  )


def get_hr_verification_service_dependency(
  session: DbSessionDep,
  redis: RedisDep,
) -> HrVerificationService:
  return get_hr_verification_service(session=session, redis=redis)


HrVerificationServiceDep = Annotated[HrVerificationService, Depends(get_hr_verification_service_dependency)]


async def _authenticate_and_consume_api_key(session: AsyncSession, api_key: str) -> str:
  if not api_key.startswith("dsf_"):
    raise AppError(status_code=401, error_code="UNAUTHORIZED", detail="Invalid API key")

  repository = AuthRepository(session=session)
  key = await repository.get_active_api_key_by_hash(hash_token(api_key))
  if key is None:
    raise AppError(status_code=401, error_code="UNAUTHORIZED", detail="Invalid API key")

  await repository.mark_api_key_used(key.id)
  limit = await repository.get_or_create_company_limit(key.company_id)
  if limit.current_month_usage >= limit.monthly_quota:
    raise AppError(status_code=429, error_code="QUOTA_EXCEEDED", detail="Monthly quota exceeded")

  await repository.increment_company_usage(key.company_id)
  return str(uuid.UUID(str(key.company_id)))


async def search_rate_limit_dependency(
  request: Request,
  response: Response,
  redis: RedisDep,
) -> None:
  api_key = request.headers.get("x-api-key")
  if api_key:
    await api_key_rate_limit(api_key=api_key, response=response, redis=redis)
    return

  await public_rate_limit(request=request, response=response, redis=redis)
