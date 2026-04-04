from __future__ import annotations

import time
from uuid import uuid4

import structlog
from fastapi import FastAPI, Request

logger = structlog.get_logger(__name__)


def register_request_context_middleware(app: FastAPI) -> None:
  @app.middleware("http")
  async def request_context_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    request.state.request_id = request_id

    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000

    response.headers["X-Request-ID"] = request_id
    logger.info(
      "request_processed",
      request_id=request_id,
      method=request.method,
      path=request.url.path,
      status_code=response.status_code,
      duration_ms=round(duration_ms, 2),
    )
    return response
