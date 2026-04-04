from __future__ import annotations

import uuid

from fastapi import APIRouter, Query, Request, Response

from app.modules.student.routers.deps import DbSessionDep, RedisDep, StudentUserDep
from app.modules.student.schemas import (
  AccessTokenListResponse,
  AccessTokenResponse,
  CreateAccessTokenRequest,
  RevokeAccessTokenResponse,
  StudentDiplomaDetailResponse,
  StudentDiplomaListResponse,
)
from app.modules.student.services import StudentService

router = APIRouter(tags=["student"])


def _base_url(request: Request) -> str:
  return str(request.base_url).rstrip("/")


@router.get("/diplomas", response_model=StudentDiplomaListResponse)
async def list_my_diplomas(
  session: DbSessionDep,
  redis: RedisDep,
  current_user: StudentUserDep,
  limit: int = Query(default=50, ge=1, le=200),
  offset: int = Query(default=0, ge=0),
) -> StudentDiplomaListResponse:
  service = StudentService(session, redis)
  return await service.list_diplomas(uuid.UUID(current_user.user_id), limit=limit, offset=offset)


@router.get("/diplomas/{diploma_id}", response_model=StudentDiplomaDetailResponse)
async def get_my_diploma_detail(
  session: DbSessionDep,
  redis: RedisDep,
  current_user: StudentUserDep,
  diploma_id: uuid.UUID,
) -> StudentDiplomaDetailResponse:
  service = StudentService(session, redis)
  return await service.get_diploma_detail(uuid.UUID(current_user.user_id), diploma_id)


@router.post("/access-tokens", response_model=AccessTokenResponse)
async def create_access_token(
  request: Request,
  session: DbSessionDep,
  redis: RedisDep,
  current_user: StudentUserDep,
  payload: CreateAccessTokenRequest,
) -> AccessTokenResponse:
  service = StudentService(session, redis)
  return await service.create_access_token(
    uuid.UUID(current_user.user_id),
    payload,
    base_url=_base_url(request),
  )


@router.get("/diplomas/{diploma_id}/access-tokens", response_model=AccessTokenListResponse)
async def list_access_tokens(
  session: DbSessionDep,
  redis: RedisDep,
  current_user: StudentUserDep,
  diploma_id: uuid.UUID,
  limit: int = Query(default=50, ge=1, le=200),
  offset: int = Query(default=0, ge=0),
) -> AccessTokenListResponse:
  service = StudentService(session, redis)
  return await service.list_access_tokens(
    uuid.UUID(current_user.user_id), diploma_id, limit=limit, offset=offset,
  )


@router.get("/access-tokens/{token_id}/qr", responses={200: {"content": {"image/png": {}}}})
async def get_qr_code_image(
  request: Request,
  session: DbSessionDep,
  redis: RedisDep,
  current_user: StudentUserDep,
  token_id: uuid.UUID,
) -> Response:
  service = StudentService(session, redis)
  image_bytes = await service.generate_qr_image(
    uuid.UUID(current_user.user_id),
    token_id,
    base_url=_base_url(request),
  )
  return Response(content=image_bytes, media_type="image/png")


@router.post("/access-tokens/{token_id}/revoke", response_model=RevokeAccessTokenResponse)
async def revoke_access_token(
  session: DbSessionDep,
  redis: RedisDep,
  current_user: StudentUserDep,
  token_id: uuid.UUID,
) -> RevokeAccessTokenResponse:
  service = StudentService(session, redis)
  return await service.revoke_access_token(uuid.UUID(current_user.user_id), token_id)
