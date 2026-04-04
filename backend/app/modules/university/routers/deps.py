from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.shared.middleware.auth import CurrentUser, require_university

UniversityUserDep = Annotated[CurrentUser, Depends(require_university)]
