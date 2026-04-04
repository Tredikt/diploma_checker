from __future__ import annotations

from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.shared.errors import AppError


def _request_id_from_request(request: Request) -> str:
  state_request_id = getattr(request.state, "request_id", None)
  if isinstance(state_request_id, str) and state_request_id:
    return state_request_id

  incoming = request.headers.get("X-Request-ID")
  return incoming if incoming else str(uuid4())


def _build_error_payload(error_code: str, detail: str, request_id: str) -> dict[str, str]:
  return {"error_code": error_code, "detail": detail, "request_id": request_id}


def register_exception_handlers(app: FastAPI) -> None:
  @app.exception_handler(AppError)
  async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    request_id = _request_id_from_request(request)
    return JSONResponse(
      status_code=exc.status_code,
      content=_build_error_payload(exc.error_code, exc.detail, request_id),
    )

  @app.exception_handler(RequestValidationError)
  async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = _request_id_from_request(request)
    first_error = exc.errors()[0] if exc.errors() else {"msg": "Validation error"}
    detail = str(first_error.get("msg", "Validation error"))
    return JSONResponse(
      status_code=422,
      content=_build_error_payload("VALIDATION_ERROR", detail, request_id),
    )

  @app.exception_handler(IntegrityError)
  async def integrity_handler(request: Request, _: IntegrityError) -> JSONResponse:
    request_id = _request_id_from_request(request)
    return JSONResponse(
      status_code=409,
      content=_build_error_payload("CONFLICT", "Resource already exists", request_id),
    )

  @app.exception_handler(HTTPException)
  async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    request_id = _request_id_from_request(request)
    code = "HTTP_ERROR"
    if exc.status_code == 401:
      code = "UNAUTHORIZED"
    elif exc.status_code == 403:
      code = "FORBIDDEN"
    elif exc.status_code == 404:
      code = "NOT_FOUND"
    return JSONResponse(
      status_code=exc.status_code,
      content=_build_error_payload(code, str(exc.detail), request_id),
    )

  @app.exception_handler(Exception)
  async def unhandled_error_handler(request: Request, _: Exception) -> JSONResponse:
    request_id = _request_id_from_request(request)
    return JSONResponse(
      status_code=500,
      content=_build_error_payload("INTERNAL_ERROR", "Internal server error", request_id),
    )
