from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from app.config import get_settings


def create_access_token(user_id: str, user_type: str) -> tuple[str, int]:
  settings = get_settings()
  expires_in = settings.access_token_expire_minutes * 60
  expires_at = datetime.now(UTC) + timedelta(seconds=expires_in)
  payload: dict[str, Any] = {
    "sub": user_id,
    "user_type": user_type,
    "exp": expires_at,
    "iat": datetime.now(UTC),
  }
  token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
  return token, expires_in


def decode_access_token(token: str) -> dict[str, Any]:
  settings = get_settings()
  return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
