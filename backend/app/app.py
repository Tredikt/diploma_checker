from __future__ import annotations

from collections.abc import Callable
from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from app.config import get_settings
from app.modules.auth.routers import router as auth_router
from app.modules.hr.routers import router as hr_router
from app.modules.student.routers import router as student_router
from app.modules.university.routers import router as university_router
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
  application.include_router(university_router)
  application.include_router(student_router)
  application.include_router(hr_router)
  application.openapi = _build_custom_openapi(application)

  register_exception_handlers(application)
  return application


def _build_custom_openapi(application: FastAPI) -> Callable[[], dict[str, Any]]:
  def custom_openapi() -> dict[str, Any]:
    if application.openapi_schema is not None:
      return application.openapi_schema

    openapi_schema = get_openapi(
      title=application.title,
      version=application.version,
      routes=application.routes,
    )
    openapi_schema["paths"]["/hr/verify/{token}"]["get"]["security"] = []
    openapi_schema["paths"]["/hr/search"]["post"]["security"] = [{"ApiKeyAuth": []}, {"BearerAuth": []}]
    application.openapi_schema = openapi_schema
    return openapi_schema

  return custom_openapi


app = create_app()
