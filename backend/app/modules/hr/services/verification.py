from __future__ import annotations

import uuid
from datetime import UTC, datetime

from redis.asyncio import Redis
from structlog import get_logger

from app.modules.hr.repositories import DiplomaSnapshot, HrDiplomaRepository, HrUniversityLookupRepository
from app.modules.hr.schemas import (
    CachedDiplomaRecord,
    DiplomaStatus,
    HrCallerContext,
    HrDiplomaRecord,
    SearchRequest,
    VerificationResult,
)
from app.modules.hr.services.presentation import HrVerificationPresenter
from app.shared.cryptography import compute_hmac
from app.shared.errors import AppError

_QR_CACHE_TTL_CAP_SECONDS = 7200
_QR_CACHE_VERSION = 1

logger = get_logger(__name__)


class HrVerificationService:
  def __init__(
    self,
    redis: Redis,
    diploma_repository: HrDiplomaRepository,
    university_lookup_repository: HrUniversityLookupRepository,
  ) -> None:
    self.redis = redis
    self.diploma_repository = diploma_repository
    self.university_lookup_repository = university_lookup_repository
    self.presenter = HrVerificationPresenter()

  async def verify_qr_token(self, token: str, caller_context: HrCallerContext) -> VerificationResult:
    diploma = await self._resolve_diploma_from_token(token)
    return self.presenter.build_verification_result(diploma=diploma, caller_context=caller_context)

  async def search_diploma(
    self,
    payload: SearchRequest,
    caller_context: HrCallerContext,
  ) -> VerificationResult:
    university_id = await self._resolve_university_id(payload.university_code)
    if university_id is None:
      raise AppError(status_code=404, error_code="DIPLOMA_NOT_FOUND", detail="Diploma not found")

    diploma_snapshot = await self.diploma_repository.find_diploma_by_hashes(
      university_id=university_id,
      diploma_number_hash=compute_hmac(payload.diploma_number),
    )
    if diploma_snapshot is None:
      raise AppError(status_code=404, error_code="DIPLOMA_NOT_FOUND", detail="Diploma not found")
      
    diploma = await self._build_record_from_snapshot(
      snapshot=diploma_snapshot,
      expires_at=datetime.max.replace(tzinfo=UTC),
      is_revoked=diploma_snapshot.status != DiplomaStatus.VALID,
    )
    return self.presenter.build_verification_result(diploma=diploma, caller_context=caller_context)

  async def _resolve_diploma_from_token(self, token: str) -> HrDiplomaRecord:
    cache_key = f"qr_token:{token}"
    
    cached_diploma = await self._get_from_cache(cache_key)
    if cached_diploma:
        return cached_diploma

    diploma = await self._fetch_from_db(token)
    
    await self._set_cache(cache_key, diploma)
    return diploma

  async def _get_from_cache(self, cache_key: str) -> HrDiplomaRecord | None:
    cache_raw = await self.redis.get(cache_key)
    if not cache_raw:
        return None

    try:
        cached = CachedDiplomaRecord.model_validate_json(cache_raw)
    except ValueError:
        return None

    if cached.version == _QR_CACHE_VERSION and cached.is_valid:
        diploma_snapshot = await self.diploma_repository.get_diploma_by_id(cached.diploma_id)
        if diploma_snapshot and diploma_snapshot.status == cached.status:
            if cached.remaining_seconds > 0:
                await self.redis.expire(cache_key, min(cached.remaining_seconds, _QR_CACHE_TTL_CAP_SECONDS))
            
            logger.info("hr.verify.cache_hit", cache_hit=True, lookup_source="redis")
            return await self._build_record_from_snapshot(
                snapshot=diploma_snapshot,
                expires_at=cached.expires_at,
                is_revoked=diploma_snapshot.status != DiplomaStatus.VALID,
            )
            
    logger.info("hr.verify.cache_fallback", cache_hit=False, lookup_source="redis")
    return None

  async def _fetch_from_db(self, token: str) -> HrDiplomaRecord:
    token_snapshot = await self.diploma_repository.get_active_token_by_value(token)
    if not token_snapshot:
      raise AppError(status_code=404, error_code="TOKEN_NOT_FOUND", detail="Token not found")
      
    expires = token_snapshot.expires_at if token_snapshot.expires_at.tzinfo else token_snapshot.expires_at.replace(tzinfo=UTC)
    if (expires - datetime.now(UTC)).total_seconds() <= 0:
      raise AppError(status_code=404, error_code="TOKEN_NOT_FOUND", detail="Token expired")

    diploma_snapshot = await self.diploma_repository.get_diploma_by_id(token_snapshot.diploma_id)
    if not diploma_snapshot:
      raise AppError(status_code=404, error_code="TOKEN_NOT_FOUND", detail="Token not found")

    diploma = await self._build_record_from_snapshot(
      snapshot=diploma_snapshot,
      expires_at=token_snapshot.expires_at,
      is_revoked=token_snapshot.is_revoked or diploma_snapshot.status != DiplomaStatus.VALID,
    )
    
    if not diploma.is_valid:
      if diploma.remaining_seconds <= 0:
        raise AppError(status_code=404, error_code="TOKEN_NOT_FOUND", detail="Token expired")
      raise AppError(status_code=404, error_code="TOKEN_NOT_FOUND", detail="Token not found")
      
    return diploma

  async def _set_cache(self, cache_key: str, diploma: HrDiplomaRecord) -> None:
    cached_record = CachedDiplomaRecord(
        diploma_id=diploma.diploma_id,
        status=diploma.status,
        expires_at=diploma.expires_at,
        version=_QR_CACHE_VERSION,
    )
    await self.redis.set(
      cache_key,
      cached_record.model_dump_json(),
      ex=min(diploma.remaining_seconds, _QR_CACHE_TTL_CAP_SECONDS),
    )
    logger.info("hr.verify.cache_warm", cache_hit=False, lookup_source="db")

  async def _build_record_from_snapshot(
    self,
    snapshot: DiplomaSnapshot,
    expires_at: datetime,
    is_revoked: bool,
  ) -> HrDiplomaRecord:
    university = await self.university_lookup_repository.get_university_by_id(snapshot.university_id)
    if university is None:
      raise AppError(status_code=404, error_code="DIPLOMA_NOT_FOUND", detail="Diploma not found")

    status = DiplomaStatus(snapshot.status) if snapshot.status in iter(DiplomaStatus) else DiplomaStatus.REVOKED

    return HrDiplomaRecord(
      diploma_id=snapshot.diploma_id,
      university_name=university.name,
      encrypted_payload=snapshot.encrypted_payload,
      status=status,
      expires_at=expires_at,
      is_revoked=is_revoked,
    )

  async def _resolve_university_id(self, university_code: str) -> uuid.UUID | None:
    cached = await self.redis.hget("uni_code_map", university_code)
    if cached is not None:
      try:
        return uuid.UUID(cached)
      except ValueError:
        logger.warning("hr.search.university_cache_invalid", university_code=university_code)

    university_id = await self.university_lookup_repository.get_university_id_by_code(university_code)
    if university_id is None:
      return None

    await self.redis.hset("uni_code_map", university_code, str(university_id))
    return university_id
