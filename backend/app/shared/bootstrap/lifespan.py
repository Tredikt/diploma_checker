from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.shared.database import get_engine
from app.shared.redis_client import close_redis_client


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
  yield
  await close_redis_client()
  await get_engine().dispose()
