from __future__ import annotations

import uuid

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.models import Diploma


class DiplomaClaimRepository:
  def __init__(self, session: AsyncSession) -> None:
    self.session = session

  async def claim_diploma_for_student(
    self,
    student_id: uuid.UUID,
    last_name_hash: str,
    first_name_hash: str,
    patronymic_hash: str | None,
    diploma_number_hash: str,
  ) -> bool:
    statement = (
      update(Diploma)
      .where(Diploma.student_id.is_(None))
      .where(Diploma.last_name_hash == last_name_hash)
      .where(Diploma.first_name_hash == first_name_hash)
      .where(Diploma.diploma_number_hash == diploma_number_hash)
      .where(Diploma.status == "VALID")
      .values(student_id=student_id)
    )
    if patronymic_hash:
      statement = statement.where(Diploma.patronymic_hash == patronymic_hash)

    result = await self.session.execute(statement)
    rowcount = getattr(result, "rowcount", None)
    return bool(rowcount and rowcount > 0)
