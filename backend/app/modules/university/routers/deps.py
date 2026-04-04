from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.database import get_db
from app.shared.middleware.auth import CurrentUser, require_university
from app.shared.redis_client import get_redis

DbSessionDep = Annotated[AsyncSession, Depends(get_db)]
RedisDep = Annotated[Redis, Depends(get_redis)]
UniversityUserDep = Annotated[CurrentUser, Depends(require_university)]
