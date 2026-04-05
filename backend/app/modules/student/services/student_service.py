from __future__ import annotations

import io
import json
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import qrcode  # type: ignore[import-untyped]
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.student.models import AccessToken
from app.modules.student.repositories import AccessTokenRepository, StudentDiplomaRepository
from app.modules.student.schemas import (
  AccessTokenListResponse,
  AccessTokenResponse,
  CreateAccessTokenRequest,
  RevokeAccessTokenResponse,
  StudentDiplomaDetailResponse,
  StudentDiplomaListResponse,
)
from app.modules.student.schemas.student import AccessTokenListItem, StudentDiplomaListItem
from app.shared.cryptography import decrypt_aes
from app.shared.errors import AppError

_QR_CACHE_TTL_CAP_SECONDS = 7200


class StudentService:
  def __init__(self, session: AsyncSession, redis: Redis) -> None:
    self.session = session
    self.redis = redis
    self.diplomas = StudentDiplomaRepository(session)
    self.tokens = AccessTokenRepository(session)

  async def list_diplomas(
    self,
    student_id: uuid.UUID,
    *,
    limit: int,
    offset: int,
  ) -> StudentDiplomaListResponse:
    items = await self.diplomas.list_for_student(student_id, limit=limit, offset=offset)
    total = await self.diplomas.count_for_student(student_id)
    return StudentDiplomaListResponse(
      items=[
        StudentDiplomaListItem(
          id=d.id,
          verification_hash=d.verification_hash,
          graduation_year=d.graduation_year,
          status="annulled" if d.status == "REVOKED" else "valid",
        )
        for d in items
      ],
      total=total,
      limit=limit,
      offset=offset,
    )

  async def get_diploma_detail(
    self,
    student_id: uuid.UUID,
    diploma_id: uuid.UUID,
  ) -> StudentDiplomaDetailResponse:
    row = await self.diplomas.get_by_id_for_student(student_id, diploma_id)
    if row is None:
      raise AppError(status_code=404, error_code="DIPLOMA_NOT_FOUND", detail="Диплом не найден")
    raw = json.loads(decrypt_aes(row.encrypted_payload))
    return StudentDiplomaDetailResponse(
      id=row.id,
      verification_hash=row.verification_hash,
      graduation_year=row.graduation_year,
      status="annulled" if row.status == "REVOKED" else "valid",
      full_name=str(raw["full_name"]),
      specialty=str(raw["specialty"]),
      diploma_number=str(raw.get("diploma_number", "")),
    )

  async def create_access_token(
    self,
    student_id: uuid.UUID,
    payload: CreateAccessTokenRequest,
    base_url: str,
  ) -> AccessTokenResponse:
    diploma = await self.diplomas.get_by_id_for_student(student_id, payload.diploma_id)
    if diploma is None:
      raise AppError(status_code=404, error_code="DIPLOMA_NOT_FOUND", detail="Диплом не найден")
    if diploma.status == "REVOKED":
      raise AppError(status_code=400, error_code="DIPLOMA_REVOKED", detail="Диплом аннулирован")

    token_value = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(days=payload.ttl_days)

    token = await self.tokens.create(
      diploma_id=diploma.id,
      token_value=token_value,
      expires_at=expires_at,
    )

    ttl_seconds = int((expires_at - datetime.now(UTC)).total_seconds())
    cache_ttl = min(ttl_seconds, _QR_CACHE_TTL_CAP_SECONDS)
    await self.redis.set(f"qr_token:{token_value}", "1", ex=cache_ttl)

    share_url = f"{base_url.rstrip('/')}/hr/verify/{token_value}"

    return AccessTokenResponse(
      id=token.id,
      diploma_id=token.diploma_id,
      token_value=token.token_value,
      share_url=share_url,
      expires_at=token.expires_at,
      is_revoked=token.is_revoked,
      created_at=token.created_at,
    )

  async def generate_qr_image(
    self,
    student_id: uuid.UUID,
    token_id: uuid.UUID,
    base_url: str,
  ) -> bytes:
    token = await self._get_owned_token(student_id, token_id)
    share_url = f"{base_url.rstrip('/')}/hr/verify/{token.token_value}"

    img = qrcode.make(share_url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

  async def list_access_tokens(
    self,
    student_id: uuid.UUID,
    diploma_id: uuid.UUID,
    *,
    limit: int,
    offset: int,
  ) -> AccessTokenListResponse:
    diploma = await self.diplomas.get_by_id_for_student(student_id, diploma_id)
    if diploma is None:
      raise AppError(status_code=404, error_code="DIPLOMA_NOT_FOUND", detail="Диплом не найден")

    items = await self.tokens.list_for_diploma(diploma_id, limit=limit, offset=offset)
    total = await self.tokens.count_for_diploma(diploma_id)
    return AccessTokenListResponse(
      items=[
        AccessTokenListItem(
          id=t.id,
          token_value=t.token_value,
          expires_at=t.expires_at,
          is_revoked=t.is_revoked,
          created_at=t.created_at,
        )
        for t in items
      ],
      total=total,
      limit=limit,
      offset=offset,
    )

  async def revoke_access_token(
    self,
    student_id: uuid.UUID,
    token_id: uuid.UUID,
  ) -> RevokeAccessTokenResponse:
    token = await self._get_owned_token(student_id, token_id)
    if token.is_revoked:
      raise AppError(status_code=400, error_code="ALREADY_REVOKED", detail="Токен уже отозван")

    await self.tokens.update_many(
      filters=[AccessToken.id == token.id],
      values={"is_revoked": True},
    )
    await self.redis.delete(f"qr_token:{token.token_value}")

    return RevokeAccessTokenResponse(id=token.id, is_revoked=True)

  async def _get_owned_token(self, student_id: uuid.UUID, token_id: uuid.UUID) -> AccessToken:
    token = await self.tokens.get_by_id(token_id)
    if token is None:
      raise AppError(status_code=404, error_code="TOKEN_NOT_FOUND", detail="Токен не найден")
    diploma = await self.diplomas.get_by_id_for_student(student_id, token.diploma_id)
    if diploma is None:
      raise AppError(status_code=403, error_code="FORBIDDEN", detail="Нет доступа к этому токену")
    return token
