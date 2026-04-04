from __future__ import annotations

import uuid

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.modules.auth.models import CompanyLimit
from app.shared.repositories import BaseRepository


class CompanyLimitRepository(BaseRepository[CompanyLimit]):
  def __init__(self, session: AsyncSession) -> None:
    super().__init__(session=session, model=CompanyLimit)

  async def get_or_create_company_limit(self, company_id: uuid.UUID) -> CompanyLimit:
    limit = await self.get_by_id(company_id, id_attr="company_id")
    if limit:
      return limit

    return await self.create(
      company_id=company_id,
      monthly_quota=get_settings().company_monthly_quota,
      current_month_usage=0,
    )

  async def increment_company_usage(self, company_id: uuid.UUID) -> CompanyLimit:
    await self.get_or_create_company_limit(company_id)
    await self.session.execute(
      update(CompanyLimit)
      .where(CompanyLimit.company_id == company_id)
      .values(current_month_usage=CompanyLimit.current_month_usage + 1)
    )

    limit = await self.get_by_id(company_id, id_attr="company_id")
    if limit is None:
      raise RuntimeError("Company limit record is missing after usage increment")
    return limit
