from __future__ import annotations

from fastapi import APIRouter

from app.modules.university.routers import diplomas

router = APIRouter(prefix="/university")
router.include_router(diplomas.router)
