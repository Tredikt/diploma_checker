from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import University


@dataclass(slots=True)
class UniversitySnapshot:
  university_id: uuid.UUID
  code: str
  name: str


class HrUniversityLookupRepository:
  def __init__(self, session: AsyncSession) -> None:
    self.session = session

  async def get_university_id_by_code(self, university_code: str) -> uuid.UUID | None:
    statement = select(University.id).where(University.code == university_code)
    return await self.session.scalar(statement)

  async def get_university_by_id(self, university_id: uuid.UUID) -> UniversitySnapshot | None:
    statement = select(University).where(University.id == university_id)
    university = await self.session.scalar(statement)
    if university is None:
      return None
    return UniversitySnapshot(
      university_id=university.id,
      code=university.code,
      name=university.name,
    )
