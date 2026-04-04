from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.database import get_db
from app.shared.middleware.auth import CurrentUser, get_current_user
from app.shared.redis_client import get_redis

DbSessionDep = Annotated[AsyncSession, Depends(get_db)]
RedisDep = Annotated[Redis, Depends(get_redis)]
CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
