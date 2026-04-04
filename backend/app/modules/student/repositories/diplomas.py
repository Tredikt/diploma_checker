from __future__ import annotations

import uuid

from sqlalchemy import desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.models import Diploma
from app.shared.repositories import BaseRepository


class StudentDiplomaRepository(BaseRepository[Diploma]):
  def __init__(self, session: AsyncSession) -> None:
    super().__init__(session=session, model=Diploma)

  async def get_by_id_for_student(
    self,
    student_id: uuid.UUID,
    diploma_id: uuid.UUID,
  ) -> Diploma | None:
    return await self.get_one(
      filters=[
        Diploma.student_id == student_id,
        Diploma.id == diploma_id,
      ],
    )

  async def list_for_student(
    self,
    student_id: uuid.UUID,
    *,
    limit: int,
    offset: int,
  ) -> list[Diploma]:
    return await self.list(
      filters=[Diploma.student_id == student_id],
      order_by=[desc(Diploma.created_at)],
      limit=limit,
      offset=offset,
    )

  async def count_for_student(self, student_id: uuid.UUID) -> int:
    return await self.count(filters=[Diploma.student_id == student_id])
