from __future__ import annotations

import secrets

from redis.asyncio import Redis

from app.config import get_settings
from app.modules.auth.repositories import AuthRepository
from app.modules.auth.schemas import LoginRequest, LoginResponse, RefreshResponse
from app.shared.cryptography import hash_token, verify_password
from app.shared.errors import AppError
from app.shared.jwt_utils import create_access_token


class SessionService:
  def __init__(self, repository: AuthRepository, redis: Redis) -> None:
    self.repository = repository
    self.redis = redis

  async def login(self, payload: LoginRequest) -> tuple[LoginResponse, str, int]:
    user = await self.repository.get_user_by_email(email=payload.email, user_type=payload.user_type)
    if user is None:
      raise AppError(status_code=401, error_code="UNAUTHORIZED", detail="Invalid credentials")

    if not verify_password(payload.password, user.password_hash):
      raise AppError(status_code=401, error_code="UNAUTHORIZED", detail="Invalid credentials")

    is_verified = getattr(user, "is_verified", True)
    if not is_verified:
      raise AppError(status_code=403, error_code="FORBIDDEN", detail="Account is not verified")

    access_token, expires_in = create_access_token(user_id=str(user.id), user_type=payload.user_type.value)
    refresh_token, refresh_ttl = await self._issue_refresh_token(
      user_id=str(user.id),
      user_type=payload.user_type.value,
    )

    return (
      LoginResponse(
        access_token=access_token,
        expires_in=expires_in,
        user_id=user.id,
        user_type=payload.user_type,
      ),
      refresh_token,
      refresh_ttl,
    )

  async def refresh(self, refresh_token: str) -> tuple[RefreshResponse, str, int]:
    key = self._refresh_redis_key(refresh_token)
    user_ref = await self.redis.get(key)
    if not user_ref:
      raise AppError(status_code=401, error_code="UNAUTHORIZED", detail="Invalid refresh token")

    await self.redis.delete(key)

    user_id, user_type = user_ref.split(":", maxsplit=1)
    access_token, expires_in = create_access_token(user_id=user_id, user_type=user_type)
    new_refresh_token, refresh_ttl = await self._issue_refresh_token(
      user_id=user_id,
      user_type=user_type,
    )

    return (
      RefreshResponse(access_token=access_token, expires_in=expires_in),
      new_refresh_token,
      refresh_ttl,
    )

  async def _issue_refresh_token(self, user_id: str, user_type: str) -> tuple[str, int]:
    settings = get_settings()
    refresh_token = secrets.token_urlsafe(48)
    refresh_ttl = settings.refresh_token_expire_days * 24 * 60 * 60
    await self.redis.setex(self._refresh_redis_key(refresh_token), refresh_ttl, f"{user_id}:{user_type}")
    return refresh_token, refresh_ttl

  @staticmethod
  def _refresh_redis_key(refresh_token: str) -> str:
    return f"auth:refresh:{hash_token(refresh_token)}"
