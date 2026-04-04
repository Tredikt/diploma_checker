from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.config import get_settings

from app.modules.auth import models as auth_models
from app.modules.student import models as student_models
from app.shared.database import Base

config = context.config

if config.config_file_name is not None:
  fileConfig(config.config_file_name)

settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url)

target_metadata = Base.metadata


def _configure_context(connection: Connection | None = None) -> None:
  context.configure(
    connection=connection,
    url=config.get_main_option("sqlalchemy.url"),
    target_metadata=target_metadata,
    include_schemas=True,
    compare_type=True,
    compare_server_default=True,
    literal_binds=connection is None,
    dialect_opts={"paramstyle": "named"},
  )


def run_migrations_offline() -> None:
  _configure_context(connection=None)

  with context.begin_transaction():
    context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
  _configure_context(connection=connection)

  with context.begin_transaction():
    context.run_migrations()


def run_migrations_online() -> None:
  connectable = async_engine_from_config(
    config.get_section(config.config_ini_section, {}),
    prefix="sqlalchemy.",
    poolclass=pool.NullPool,
  )

  async def run_async_migrations() -> None:
    async with connectable.connect() as connection:
      await connection.run_sync(do_run_migrations)
    await connectable.dispose()

  from asyncio import run

  run(run_async_migrations())


if context.is_offline_mode():
  run_migrations_offline()
else:
  run_migrations_online()
