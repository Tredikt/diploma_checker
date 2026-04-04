from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database import Base


class University(Base):
  __tablename__ = "universities"
  __table_args__ = {"schema": "auth"}

  id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
  name: Mapped[str] = mapped_column(String(255), nullable=False)
  email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
  password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
  public_key: Mapped[str | None] = mapped_column(Text, nullable=True)
  is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
