from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database import Base


class ApiKey(Base):
  __tablename__ = "api_keys"
  __table_args__ = {"schema": "auth"}

  id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
  key_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
  key_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
  is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
  last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
