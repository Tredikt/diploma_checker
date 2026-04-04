from __future__ import annotations

import os
import subprocess
import sys
import uuid
from collections.abc import AsyncIterator, Generator
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from testcontainers.postgres import PostgresContainer
from testcontainers.redis import RedisContainer

BACKEND_ROOT = Path(__file__).resolve().parent.parent


def _secrets_env(base: dict[str, str]) -> dict[str, str]:
  merged = {**base}
  merged.update(
    {
      "JWT_SECRET_KEY": "test_jwt_secret_key_minimum_len_32_x",
      "AES_ENCRYPTION_KEY": "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=",
      "HMAC_SECRET_KEY": "test_hmac_secret_minimum_16_chars",
      "PUBLIC_RATE_LIMIT_PER_MINUTE": "100000",
      "B2B_RATE_LIMIT_PER_MINUTE": "100000",
      "APP_ENV": "development",
    },
  )
  return merged


def _reset_app_singletons() -> None:
  import app.config as app_config
  import app.shared.database as database
  import app.shared.redis_client as redis_client

  app_config.get_settings.cache_clear()
  database._engine = None  # noqa: SLF001
  database._session_maker = None  # noqa: SLF001
  redis_client._redis_client = None  # noqa: SLF001


async def _clear_app_tables(engine: AsyncEngine) -> None:
  # DELETE (not TRUNCATE ... CASCADE): CASCADE can drop the core.diploma_status enum in PostgreSQL.
  async with engine.begin() as conn:
    await conn.execute(text("DELETE FROM auth.api_keys"))
    await conn.execute(text("DELETE FROM auth.company_limits"))
    await conn.execute(text("DELETE FROM core.diplomas"))
    await conn.execute(text("DELETE FROM auth.students"))
    await conn.execute(text("DELETE FROM auth.companies"))
    await conn.execute(text("DELETE FROM auth.universities"))


@pytest.fixture(scope="session")
def docker_db_and_redis_urls() -> Generator[tuple[str, str], None, None]:
  postgres = PostgresContainer("postgres:16-alpine")
  redis_container = RedisContainer()
  postgres.start()
  redis_container.start()
  try:
    raw_pg = postgres.get_connection_url()
    pg_url = raw_pg.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
    if "asyncpg" not in pg_url:
      pg_url = raw_pg.replace("postgresql://", "postgresql+asyncpg://", 1)
    redis_host = redis_container.get_container_host_ip()
    redis_port = redis_container.get_exposed_port(6379)
    redis_url = f"redis://{redis_host}:{redis_port}/0"
    yield (pg_url, redis_url)
  finally:
    redis_container.stop()
    postgres.stop()


@pytest.fixture(scope="session")
def migrated_database(docker_db_and_redis_urls: tuple[str, str]) -> tuple[str, str]:
  db_url, redis_url = docker_db_and_redis_urls
  session_env = _secrets_env(dict(os.environ))
  session_env["DATABASE_URL"] = db_url
  session_env["REDIS_URL"] = redis_url

  subprocess.run(
    [sys.executable, "-m", "alembic", "upgrade", "head"],
    cwd=BACKEND_ROOT,
    env=session_env,
    check=True,
  )

  os.environ["DATABASE_URL"] = db_url
  os.environ["REDIS_URL"] = redis_url
  for key in (
    "JWT_SECRET_KEY",
    "AES_ENCRYPTION_KEY",
    "HMAC_SECRET_KEY",
    "PUBLIC_RATE_LIMIT_PER_MINUTE",
    "B2B_RATE_LIMIT_PER_MINUTE",
    "APP_ENV",
  ):
    os.environ[key] = session_env[key]

  _reset_app_singletons()
  return db_url, redis_url


@pytest.fixture(autouse=True)
async def _reset_db_between_tests(migrated_database: tuple[str, str]) -> AsyncIterator[None]:
  db_url, _redis_url = migrated_database
  _reset_app_singletons()
  engine = create_async_engine(db_url)
  await _clear_app_tables(engine)
  await engine.dispose()
  yield
  _reset_app_singletons()


@pytest.fixture
async def client(migrated_database: tuple[str, str]) -> AsyncIterator[AsyncClient]:
  _ = migrated_database
  _reset_app_singletons()

  # Late import: session fixtures must set os.environ before app loads settings.
  from app.app import create_app

  application = create_app()
  transport = ASGITransport(app=application)
  async with application.router.lifespan_context(application):
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
      yield ac

  _reset_app_singletons()


@pytest.fixture
def unique_email() -> str:
  return f"user_{uuid.uuid4().hex[:12]}@example.com"


@pytest.fixture
def strong_password() -> str:
  return "Password1!strong"
