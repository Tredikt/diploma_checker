from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, File, Query, UploadFile

from app.modules.auth.routers.deps import DbSessionDep, RedisDep
from app.modules.university.routers.deps import UniversityUserDep
from app.modules.university.schemas import (
  DiplomaCreatedResponse,
  DiplomaCreateRequest,
  DiplomaDetailResponse,
  DiplomaImportResponse,
  DiplomaListResponse,
  RevokeDiplomaResponse,
)
from app.modules.university.services import DiplomaRegistryService
from app.modules.university.services.import_parser import parse_csv_bytes, parse_xlsx_bytes
from app.shared.errors import AppError

router = APIRouter(tags=["university"])


@router.post("/diplomas", response_model=DiplomaCreatedResponse)
async def create_diploma_row(
  session: DbSessionDep,
  redis: RedisDep,
  current_user: UniversityUserDep,
  payload: DiplomaCreateRequest,
) -> DiplomaCreatedResponse:
  service = DiplomaRegistryService(session, redis)
  return await service.create_one(uuid.UUID(current_user.user_id), payload)


@router.post("/diplomas/import", response_model=DiplomaImportResponse)
async def import_diploma_registry(
  session: DbSessionDep,
  redis: RedisDep,
  current_user: UniversityUserDep,
  file: Annotated[UploadFile, File()],
) -> DiplomaImportResponse:
  name = (file.filename or "").lower()
  content = await file.read()
  if name.endswith(".csv"):
    rows = parse_csv_bytes(content)
  elif name.endswith(".xlsx") or name.endswith(".xlsm"):
    rows = parse_xlsx_bytes(content)
  else:
    raise AppError(
      status_code=400,
      error_code="UNSUPPORTED_FILE",
      detail="Поддерживаются файлы .csv и .xlsx",
    )
  service = DiplomaRegistryService(session, redis)
  return await service.import_rows(uuid.UUID(current_user.user_id), rows)


@router.get("/diplomas", response_model=DiplomaListResponse)
async def list_diploma_registry(
  session: DbSessionDep,
  redis: RedisDep,
  current_user: UniversityUserDep,
  limit: int = Query(default=50, ge=1, le=200),
  offset: int = Query(default=0, ge=0),
) -> DiplomaListResponse:
  service = DiplomaRegistryService(session, redis)
  return await service.list_diplomas(uuid.UUID(current_user.user_id), limit=limit, offset=offset)


@router.get("/diplomas/{verification_hash}", response_model=DiplomaDetailResponse)
async def get_diploma_detail(
  session: DbSessionDep,
  redis: RedisDep,
  current_user: UniversityUserDep,
  verification_hash: str,
) -> DiplomaDetailResponse:
  service = DiplomaRegistryService(session, redis)
  return await service.get_detail(uuid.UUID(current_user.user_id), verification_hash)


@router.post("/diplomas/{verification_hash}/revoke", response_model=RevokeDiplomaResponse)
async def revoke_diploma(
  session: DbSessionDep,
  redis: RedisDep,
  current_user: UniversityUserDep,
  verification_hash: str,
) -> RevokeDiplomaResponse:
  service = DiplomaRegistryService(session, redis)
  return await service.revoke(uuid.UUID(current_user.user_id), verification_hash)
