from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.database import Base


class CompanyLimit(Base):
  __tablename__ = "company_limits"
  __table_args__ = {"schema": "auth"}

  company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
  monthly_quota: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
  current_month_usage: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
  last_reset_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
