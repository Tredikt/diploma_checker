from __future__ import annotations

from fastapi import APIRouter

from app.modules.hr.routers.verification import router as verification_router

router = APIRouter(prefix="/hr", tags=["hr"])
router.include_router(verification_router)
