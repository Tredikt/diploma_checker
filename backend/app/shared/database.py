from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
  pass


_engine: AsyncEngine | None = None
_session_maker: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
  global _engine
  if _engine is None:
    settings = get_settings()
    _engine = create_async_engine(
      settings.database_url,
      pool_pre_ping=True,
      pool_size=settings.database_pool_size,
      future=True,
    )
  return _engine


def get_session_maker() -> async_sessionmaker[AsyncSession]:
  global _session_maker
  if _session_maker is None:
    _session_maker = async_sessionmaker(
      bind=get_engine(),
      class_=AsyncSession,
      expire_on_commit=False,
      autoflush=False,
    )
  return _session_maker


async def get_db() -> AsyncGenerator[AsyncSession, None]:
  session_factory = get_session_maker()
  async with session_factory() as session:
    try:
      yield session
      await session.commit()
    except Exception:
      await session.rollback()
      raise
