from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.database import get_db
from app.shared.errors import AppError
from app.shared.middleware.auth import CurrentUser, get_current_user
from app.shared.redis_client import get_redis
from app.shared.types.auth import UserTypeEnum

DbSessionDep = Annotated[AsyncSession, Depends(get_db)]
RedisDep = Annotated[Redis, Depends(get_redis)]


def require_student(
  user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
  if user.user_type is not UserTypeEnum.STUDENT:
    raise AppError(status_code=403, error_code="FORBIDDEN", detail="Student role required")
  return user


StudentUserDep = Annotated[CurrentUser, Depends(require_student)]
