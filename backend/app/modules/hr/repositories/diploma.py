from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.models import AccessToken, Diploma


@dataclass(slots=True)
class DiplomaSnapshot:
  diploma_id: uuid.UUID
  university_id: uuid.UUID
  encrypted_payload: str
  status: str


@dataclass(slots=True)
class TokenSnapshot:
  token_value: str
  diploma_id: uuid.UUID
  expires_at: datetime
  is_revoked: bool


class HrDiplomaRepository:
  def __init__(self, session: AsyncSession) -> None:
    self.session = session

  async def get_active_token_by_value(self, token_value: str) -> TokenSnapshot | None:
    statement = (
      select(AccessToken)
      .where(AccessToken.token_value == token_value)
      .where(AccessToken.is_revoked.is_(False))
    )
    token = await self.session.scalar(statement)
    if token is None:
      return None
    return TokenSnapshot(
      token_value=token.token_value,
      diploma_id=token.diploma_id,
      expires_at=token.expires_at,
      is_revoked=token.is_revoked,
    )

  async def get_diploma_by_id(self, diploma_id: uuid.UUID) -> DiplomaSnapshot | None:
    statement = select(Diploma).where(Diploma.id == diploma_id)
    diploma = await self.session.scalar(statement)
    return self._to_snapshot(diploma)

  async def find_diploma_by_hashes(self, university_id: uuid.UUID, diploma_number_hash: str) -> DiplomaSnapshot | None:
    statement = (
      select(Diploma)
      .where(Diploma.university_id == university_id)
      .where(Diploma.diploma_number_hash == diploma_number_hash)
    )
    diploma = await self.session.scalar(statement)
    return self._to_snapshot(diploma)

  @staticmethod
  def _to_snapshot(diploma: Diploma | None) -> DiplomaSnapshot | None:
    if diploma is None:
      return None
    return DiplomaSnapshot(
      diploma_id=diploma.id,
      university_id=diploma.university_id,
      encrypted_payload=diploma.encrypted_payload,
      status=diploma.status,
    )
