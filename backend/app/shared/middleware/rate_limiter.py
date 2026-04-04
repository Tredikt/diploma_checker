from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request, Response
from redis.asyncio import Redis

from app.config import get_settings
from app.shared.errors import AppError
from app.shared.redis_client import get_redis


def _extract_client_ip(request: Request) -> str:
  forwarded_for = request.headers.get("X-Forwarded-For")
  if forwarded_for:
    return forwarded_for.split(",")[0].strip()
  if request.client:
    return request.client.host
  return "unknown"


async def _enforce_rate_limit(
  redis: Redis,
  key: str,
  limit: int,
  window_seconds: int,
  response: Response,
) -> None:
  current = await redis.incr(key)
  if current == 1:
    await redis.expire(key, window_seconds)

  remaining = max(limit - current, 0)
  ttl = await redis.ttl(key)

  response.headers["X-RateLimit-Limit"] = str(limit)
  response.headers["X-RateLimit-Remaining"] = str(remaining)
  response.headers["Retry-After"] = str(ttl if ttl > 0 else window_seconds)

  if current > limit:
    raise AppError(
      status_code=429,
      error_code="RATE_LIMIT_EXCEEDED",
      detail="Too many requests",
    )


async def public_rate_limit(
  request: Request,
  response: Response,
  redis: Annotated[Redis, Depends(get_redis)],
) -> None:
  settings = get_settings()
  client_ip = _extract_client_ip(request)
  key = f"rate:public:ip:{client_ip}"
  await _enforce_rate_limit(
    redis=redis,
    key=key,
    limit=settings.public_rate_limit_per_minute,
    window_seconds=60,
    response=response,
  )


async def api_key_rate_limit(
  api_key: str,
  response: Response,
  redis: Redis,
) -> None:
  settings = get_settings()
  key = f"rate:b2b:key:{api_key}"
  await _enforce_rate_limit(
    redis=redis,
    key=key,
    limit=settings.b2b_rate_limit_per_minute,
    window_seconds=60,
    response=response,
  )
