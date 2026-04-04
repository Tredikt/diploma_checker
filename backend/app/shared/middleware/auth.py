from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.shared.errors import AppError
from app.shared.jwt_utils import decode_access_token
from app.shared.types.auth import UserTypeEnum

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


@dataclass(slots=True)
class CurrentUser:
  user_id: str
  user_type: UserTypeEnum


async def get_current_user(
  credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> CurrentUser:
  return resolve_current_user_from_token(credentials.credentials)

def resolve_current_user_from_token(token: str) -> CurrentUser:
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


async def get_current_user_optional(
  credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(optional_security)],
) -> CurrentUser | None:
  if credentials is None:
    return None
  return resolve_current_user_from_token(credentials.credentials)


def require_company(
  user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
  if user.user_type is not UserTypeEnum.COMPANY:
    raise AppError(status_code=403, error_code="FORBIDDEN", detail="Company role required")
  return user


def require_university(
  user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
  if user.user_type is not UserTypeEnum.UNIVERSITY:
    raise AppError(status_code=403, error_code="FORBIDDEN", detail="University role required")
  return user
