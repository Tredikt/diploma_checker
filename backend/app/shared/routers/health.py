from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.shared.database import get_engine
from app.shared.redis_client import get_redis_client

router = APIRouter()


@router.get("/health")
async def health() -> JSONResponse:
  engine = get_engine()
  redis = get_redis_client()

  db_ok = False
  redis_ok = False

  try:
    async with engine.connect() as connection:
      await connection.execute(text("SELECT 1"))
    db_ok = True
  except Exception:
    db_ok = False

  try:
    redis_ok = bool(await redis.ping())
  except Exception:
    redis_ok = False

  status = "ok" if db_ok and redis_ok else "degraded"
  return JSONResponse(
    {
      "status": status,
      "database": db_ok,
      "redis": redis_ok,
      "timestamp": datetime.now(UTC).isoformat(),
    }
  )
