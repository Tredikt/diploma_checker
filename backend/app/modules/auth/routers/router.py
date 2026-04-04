from __future__ import annotations

from fastapi import APIRouter

from app.modules.auth.routers.company import router as company_router
from app.modules.auth.routers.profile import router as profile_router
from app.modules.auth.routers.public import router as public_router

router = APIRouter(prefix="/auth")
router.include_router(public_router)
router.include_router(profile_router)
router.include_router(company_router)
