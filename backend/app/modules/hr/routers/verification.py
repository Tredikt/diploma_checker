from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends

from app.modules.hr.routers.deps import (
  HrCallerContextDep,
  HrVerificationServiceDep,
  search_rate_limit_dependency,
)
from app.modules.hr.schemas import SearchRequest, VerificationResult
from app.shared.middleware.rate_limiter import public_rate_limit

router = APIRouter()


@router.get(
  "/verify/{token}",
  response_model=VerificationResult,
  dependencies=[Depends(public_rate_limit)],
  openapi_extra={"security": []},
)
async def verify_qr_token(
  token: UUID,
  service: HrVerificationServiceDep,
  caller_context: HrCallerContextDep,
) -> VerificationResult:
  return await service.verify_qr_token(token=str(token), caller_context=caller_context)


@router.post(
  "/search",
  response_model=VerificationResult,
  dependencies=[Depends(search_rate_limit_dependency)],
  openapi_extra={"security": [{"ApiKeyAuth": []}, {"BearerAuth": []}]},
)
async def search_diploma(
  payload: SearchRequest,
  service: HrVerificationServiceDep,
  caller_context: HrCallerContextDep,
) -> VerificationResult:
  return await service.search_diploma(payload=payload, caller_context=caller_context)
