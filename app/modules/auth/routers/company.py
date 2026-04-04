from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Response

from app.modules.auth.routers.deps import CurrentUserDep, DbSessionDep, RedisDep
from app.modules.auth.schemas import ApiKeyCreateRequest, ApiKeyList, ApiKeyResponse, CompanyLimitsResponse
from app.modules.auth.services import AuthService
from app.shared.middleware.auth import require_company

router = APIRouter(
  prefix="/companies",
  tags=["companies"],
  dependencies=[Depends(require_company)],
)


@router.get("/api-keys", response_model=ApiKeyList)
async def list_api_keys(
  session: DbSessionDep,
  redis: RedisDep,
  current_company: CurrentUserDep,
  limit: int = 20,
  offset: int = 0,
) -> ApiKeyList:
  return await AuthService(session=session, redis=redis).list_api_keys(
    company_id=current_company.user_id,
    limit=limit,
    offset=offset,
  )


@router.post("/api-keys", status_code=201, response_model=ApiKeyResponse)
async def create_api_key(
  payload: ApiKeyCreateRequest,
  session: DbSessionDep,
  redis: RedisDep,
  current_company: CurrentUserDep,
) -> ApiKeyResponse:
  return await AuthService(session=session, redis=redis).create_api_key(
    company_id=current_company.user_id,
    payload=payload,
  )


@router.delete("/api-keys/{key_id}", status_code=204)
async def delete_api_key(
  key_id: UUID,
  session: DbSessionDep,
  redis: RedisDep,
  current_company: CurrentUserDep,
) -> Response:
  await AuthService(session=session, redis=redis).revoke_api_key(
    company_id=current_company.user_id,
    key_id=key_id,
  )
  return Response(status_code=204)


@router.get("/limits", response_model=CompanyLimitsResponse)
async def company_limits(
  session: DbSessionDep,
  redis: RedisDep,
  current_company: CurrentUserDep,
) -> CompanyLimitsResponse:
  return await AuthService(session=session, redis=redis).get_company_limits(
    company_id=current_company.user_id,
  )
