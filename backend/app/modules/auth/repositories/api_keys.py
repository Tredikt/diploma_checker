from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import ApiKey
from app.shared.repositories import BaseRepository


class ApiKeyRepository(BaseRepository[ApiKey]):
  def __init__(self, session: AsyncSession) -> None:
    super().__init__(session=session, model=ApiKey)

  async def create_api_key(self, company_id: uuid.UUID, key_hash: str, key_label: str | None) -> ApiKey:
    return await self.create(
      company_id=company_id,
      key_hash=key_hash,
      key_label=key_label,
      is_active=True,
    )

  async def list_api_keys(self, company_id: uuid.UUID, limit: int, offset: int) -> tuple[list[ApiKey], int]:
    items = await self.list(
      filters={"company_id": company_id},
      order_by=[ApiKey.created_at.desc()],
      limit=limit,
      offset=offset,
    )
    total = await self.count(filters={"company_id": company_id})
    return items, total

  async def deactivate_api_key(self, company_id: uuid.UUID, key_id: uuid.UUID) -> bool:
    updated = await self.update_many(
      filters={"id": key_id, "company_id": company_id},
      values={"is_active": False},
    )
    return updated > 0
