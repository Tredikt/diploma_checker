"""add diploma registry fields for university module

Revision ID: f8a91c2d4b10
Revises: 0515e497c271
Create Date: 2026-04-04 16:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f8a91c2d4b10"
down_revision: str | Sequence[str] | None = "0515e497c271"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
  op.add_column("diplomas", sa.Column("graduation_year", sa.Integer(), nullable=True), schema="core")
  op.add_column("diplomas", sa.Column("specialty_hash", sa.String(length=255), nullable=True), schema="core")
  op.add_column("diplomas", sa.Column("verification_hash", sa.String(length=64), nullable=True), schema="core")

  # asyncpg: одна команда на execute (нельзя несколько через prepared statement).
  op.execute(sa.text("UPDATE core.diplomas SET graduation_year = 1970 WHERE graduation_year IS NULL"))
  op.execute(sa.text("UPDATE core.diplomas SET specialty_hash = 'legacy' WHERE specialty_hash IS NULL"))
  op.execute(
    sa.text(
      "UPDATE core.diplomas SET verification_hash = replace(gen_random_uuid()::text, '-', '') "
      "|| replace(gen_random_uuid()::text, '-', '') WHERE verification_hash IS NULL",
    ),
  )

  op.alter_column("diplomas", "graduation_year", nullable=False, schema="core")
  op.alter_column("diplomas", "specialty_hash", nullable=False, schema="core")
  op.alter_column("diplomas", "verification_hash", nullable=False, schema="core")
  op.create_unique_constraint("uq_diplomas_verification_hash", "diplomas", ["verification_hash"], schema="core")


def downgrade() -> None:
  op.drop_constraint("uq_diplomas_verification_hash", "diplomas", schema="core", type_="unique")
  op.drop_column("diplomas", "verification_hash", schema="core")
  op.drop_column("diplomas", "specialty_hash", schema="core")
  op.drop_column("diplomas", "graduation_year", schema="core")
