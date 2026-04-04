from __future__ import annotations

import uuid

from sqlalchemy import desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.models import Diploma
from app.shared.repositories import BaseRepository


class DiplomaRegistryRepository(BaseRepository[Diploma]):
  def __init__(self, session: AsyncSession) -> None:
    super().__init__(session=session, model=Diploma)

  async def get_by_verification_hash_for_university(
    self,
    university_id: uuid.UUID,
    verification_hash: str,
  ) -> Diploma | None:
    return await self.get_one(
      filters=[
        Diploma.university_id == university_id,
        Diploma.verification_hash == verification_hash,
      ],
    )

  async def list_for_university(
    self,
    university_id: uuid.UUID,
    *,
    limit: int,
    offset: int,
  ) -> list[Diploma]:
    return await self.list(
      filters=[Diploma.university_id == university_id],
      order_by=[desc(Diploma.created_at)],
      limit=limit,
      offset=offset,
    )

  async def count_for_university(self, university_id: uuid.UUID) -> int:
    return await self.count(filters=[Diploma.university_id == university_id])
