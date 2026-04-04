from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

import jwt
from fastapi import Depends, Header

from app.shared.errors import AppError
from app.shared.jwt_utils import decode_access_token
from app.shared.types.auth import UserTypeEnum


@dataclass(slots=True)
class CurrentUser:
  user_id: str
  user_type: UserTypeEnum


def _parse_authorization_header(authorization: str | None) -> str:
  if authorization is None:
    raise AppError(status_code=401, error_code="UNAUTHORIZED", detail="Missing bearer token")

  prefix = "Bearer "
  if not authorization.startswith(prefix):
    raise AppError(status_code=401, error_code="UNAUTHORIZED", detail="Invalid auth scheme")

  return authorization[len(prefix) :]


async def get_current_user(
  authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> CurrentUser:
  token = _parse_authorization_header(authorization)
  try:
    payload = decode_access_token(token)
  except jwt.PyJWTError as exc:
    raise AppError(status_code=401, error_code="UNAUTHORIZED", detail="Invalid token") from exc

  user_id = payload.get("sub")
  user_type = payload.get("user_type")
  if not isinstance(user_id, str) or not isinstance(user_type, str):
    raise AppError(status_code=401, error_code="UNAUTHORIZED", detail="Invalid token claims")

  try:
    enum_user_type = UserTypeEnum(user_type)
  except ValueError as exc:
    raise AppError(status_code=401, error_code="UNAUTHORIZED", detail="Invalid token claims") from exc

  return CurrentUser(user_id=user_id, user_type=enum_user_type)


def require_company(
  user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
  if user.user_type is not UserTypeEnum.COMPANY:
    raise AppError(status_code=403, error_code="FORBIDDEN", detail="Company role required")
  return user
