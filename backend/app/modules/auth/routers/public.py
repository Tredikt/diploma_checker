from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Response, Security
from fastapi.security import APIKeyCookie

from app.config import get_settings
from app.modules.auth.routers.deps import DbSessionDep, RedisDep
from app.modules.auth.schemas import (
  CompanyRegistrationRequest,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegistrationResponse,
  StudentRegistrationRequest,
  UniversityRegistrationRequest,
)
from app.modules.auth.services import AuthService
from app.shared.errors import AppError
from app.shared.middleware.rate_limiter import public_rate_limit

router = APIRouter(dependencies=[Depends(public_rate_limit)])
refresh_cookie_scheme = APIKeyCookie(name="refresh_token", auto_error=False)


def _set_refresh_cookie(response: Response, refresh_token: str, max_age: int) -> None:
  settings = get_settings()
  secure_cookie = settings.app_env == "production"
  response.set_cookie(
    key="refresh_token",
    value=refresh_token,
    httponly=True,
    secure=secure_cookie,
    samesite="none" if secure_cookie else "lax",
    path="/",
    max_age=max_age,
  )


@router.post(
  "/register/university",
  status_code=201,
  response_model=RegistrationResponse,
)
async def register_university(
  payload: UniversityRegistrationRequest,
  session: DbSessionDep,
  redis: RedisDep,
) -> RegistrationResponse:
  return await AuthService(session=session, redis=redis).register_university(payload)


@router.post(
  "/register/company",
  status_code=201,
  response_model=RegistrationResponse,
)
async def register_company(
  payload: CompanyRegistrationRequest,
  session: DbSessionDep,
  redis: RedisDep,
) -> RegistrationResponse:
  return await AuthService(session=session, redis=redis).register_company(payload)


@router.post(
  "/register/student",
  status_code=201,
  response_model=RegistrationResponse,
)
async def register_student(
  payload: StudentRegistrationRequest,
  session: DbSessionDep,
  redis: RedisDep,
) -> RegistrationResponse:
  return await AuthService(session=session, redis=redis).register_student(payload)


@router.post("/login", response_model=LoginResponse)
async def login(
  payload: LoginRequest,
  response: Response,
  session: DbSessionDep,
  redis: RedisDep,
) -> LoginResponse:
  result, refresh_token, refresh_ttl = await AuthService(session=session, redis=redis).login(payload)
  _set_refresh_cookie(response, refresh_token, refresh_ttl)
  return result


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
  response: Response,
  session: DbSessionDep,
  redis: RedisDep,
  refresh_token: Annotated[str | None, Security(refresh_cookie_scheme)] = None,
) -> RefreshResponse:
  if refresh_token is None:
    raise AppError(status_code=401, error_code="UNAUTHORIZED", detail="Missing refresh token cookie")
  result, new_refresh_token, refresh_ttl = await AuthService(session=session, redis=redis).refresh(
    refresh_token,
  )
  _set_refresh_cookie(response, new_refresh_token, refresh_ttl)
  return result
