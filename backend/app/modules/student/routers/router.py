from __future__ import annotations

from fastapi import APIRouter

from app.modules.student.routers import diplomas

router = APIRouter(prefix="/student")
router.include_router(diplomas.router)
