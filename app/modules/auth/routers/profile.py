from __future__ import annotations

from fastapi import APIRouter

from app.modules.auth.routers.deps import CurrentUserDep, DbSessionDep, RedisDep
from app.modules.auth.schemas import CompanyProfile, StudentProfile, UniversityProfile
from app.modules.auth.services import AuthService

router = APIRouter()


@router.get("/me", response_model=UniversityProfile | CompanyProfile | StudentProfile)
async def me(
  session: DbSessionDep,
  redis: RedisDep,
  current_user: CurrentUserDep,
) -> UniversityProfile | CompanyProfile | StudentProfile:
  return await AuthService(session=session, redis=redis).get_me(
    user_id=current_user.user_id,
    user_type=current_user.user_type,
  )
