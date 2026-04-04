from __future__ import annotations

import uuid

from sqlalchemy import desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.student.models import AccessToken
from app.shared.repositories import BaseRepository


class AccessTokenRepository(BaseRepository[AccessToken]):
  def __init__(self, session: AsyncSession) -> None:
    super().__init__(session=session, model=AccessToken)

  async def get_by_token_value(self, token_value: str) -> AccessToken | None:
    return await self.get_one(filters=[AccessToken.token_value == token_value])

  async def list_for_diploma(
    self,
    diploma_id: uuid.UUID,
    *,
    limit: int,
    offset: int,
  ) -> list[AccessToken]:
    return await self.list(
      filters=[AccessToken.diploma_id == diploma_id],
      order_by=[desc(AccessToken.created_at)],
      limit=limit,
      offset=offset,
    )

  async def count_for_diploma(self, diploma_id: uuid.UUID) -> int:
    return await self.count(filters=[AccessToken.diploma_id == diploma_id])
