from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import University
from app.shared.repositories import BaseRepository


class UniversityAccountRepository(BaseRepository[University]):
  def __init__(self, session: AsyncSession) -> None:
    super().__init__(session=session, model=University)
