from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database import Base


class Diploma(Base):
  __tablename__ = "diplomas"
  __table_args__ = (
    UniqueConstraint("university_id", "diploma_number_hash", name="uq_university_diploma_number"),
    {"schema": "core"},
  )

  id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  university_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
  student_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
  last_name_hash: Mapped[str] = mapped_column(String(255), nullable=False)
  first_name_hash: Mapped[str] = mapped_column(String(255), nullable=False)
  patronymic_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
  diploma_number_hash: Mapped[str] = mapped_column(String(255), nullable=False)
  encrypted_payload: Mapped[str] = mapped_column(Text, nullable=False)
  digital_signature: Mapped[str] = mapped_column(Text, nullable=False)
  status: Mapped[str] = mapped_column(ENUM("VALID", "REVOKED", name="diploma_status", create_type=True), nullable=False, default="VALID")
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
