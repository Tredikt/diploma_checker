from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import CompanyLimit
from app.shared.repositories import BaseRepository
from app.config import get_settings


class CompanyLimitRepository(BaseRepository[CompanyLimit]):
  def __init__(self, session: AsyncSession) -> None:
    super().__init__(session=session, model=CompanyLimit)

  async def get_or_create_company_limit(self, company_id: uuid.UUID) -> CompanyLimit:
    limit = await self.get_by_id(company_id, id_attr="company_id")
    if limit:
      return limit

    return await self.create(
      company_id=company_id,
      monthly_quota=get_settings().default_monthly_quota,
      current_month_usage=0,
    )
