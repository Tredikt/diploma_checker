from __future__ import annotations

from fastapi import FastAPI

from app.config import get_settings
from app.modules.auth.routers import router as auth_router
from app.shared.bootstrap import lifespan
from app.shared.middleware import register_cors_middleware, register_request_context_middleware
from app.shared.middleware.exceptions import register_exception_handlers
from app.shared.routers import health_router


def create_app() -> FastAPI:
  settings = get_settings()

  application = FastAPI(
    title="Diasoft Verify Diploma API",
    version="1.0.0",
    lifespan=lifespan,
  )

  register_cors_middleware(application, settings)
  register_request_context_middleware(application)

  application.include_router(health_router)
  application.include_router(auth_router)

  register_exception_handlers(application)
  return application


app = create_app()
