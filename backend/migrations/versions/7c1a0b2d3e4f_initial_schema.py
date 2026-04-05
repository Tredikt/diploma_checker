"""Единая начальная миграция: схемы auth + core в актуальном виде (как в ORM).

Revision ID: 7c1a0b2d3e4f
Revises:
Create Date: 2026-04-05

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "7c1a0b2d3e4f"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
  op.execute(sa.text("CREATE SCHEMA IF NOT EXISTS auth"))
  op.execute(sa.text("CREATE SCHEMA IF NOT EXISTS core"))
  op.execute(sa.text("CREATE TYPE core.diploma_status AS ENUM ('VALID', 'REVOKED')"))

  op.create_table(
    "universities",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
    sa.Column("code", sa.String(length=50), nullable=False),
    sa.Column("name", sa.String(length=255), nullable=False),
    sa.Column("email", sa.String(length=255), nullable=False),
    sa.Column("password_hash", sa.String(length=255), nullable=False),
    sa.Column("public_key", sa.Text(), nullable=True),
    sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.UniqueConstraint("code"),
    sa.UniqueConstraint("email"),
    schema="auth",
  )

  op.create_table(
    "students",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
    sa.Column("email", sa.String(length=255), nullable=False),
    sa.Column("password_hash", sa.String(length=255), nullable=False),
    sa.Column("encrypted_last_name", sa.Text(), nullable=False),
    sa.Column("encrypted_first_name", sa.Text(), nullable=False),
    sa.Column("encrypted_patronymic", sa.Text(), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.UniqueConstraint("email"),
    schema="auth",
  )

  op.create_table(
    "companies",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
    sa.Column("company_name", sa.String(length=255), nullable=False),
    sa.Column("email", sa.String(length=255), nullable=False),
    sa.Column("password_hash", sa.String(length=255), nullable=False),
    sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.UniqueConstraint("email"),
    schema="auth",
  )

  op.create_table(
    "api_keys",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
    sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column("key_hash", sa.String(length=255), nullable=False),
    sa.Column("key_label", sa.String(length=100), nullable=True),
    sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(["company_id"], ["auth.companies.id"], ondelete="CASCADE"),
    sa.UniqueConstraint("key_hash"),
    schema="auth",
  )

  op.create_table(
    "company_limits",
    sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column("monthly_quota", sa.Integer(), nullable=False, server_default=sa.text("1000")),
    sa.Column("current_month_usage", sa.Integer(), nullable=False, server_default=sa.text("0")),
    sa.Column("last_reset_date", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.ForeignKeyConstraint(["company_id"], ["auth.companies.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("company_id"),
    schema="auth",
  )

  diploma_status = postgresql.ENUM("VALID", "REVOKED", name="diploma_status", schema="core", create_type=False)

  op.create_table(
    "diplomas",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
    sa.Column("university_id", postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=True),
    sa.Column("last_name_hash", sa.String(length=255), nullable=False),
    sa.Column("first_name_hash", sa.String(length=255), nullable=False),
    sa.Column("patronymic_hash", sa.String(length=255), nullable=True),
    sa.Column("graduation_year", sa.Integer(), nullable=False),
    sa.Column("specialty_hash", sa.String(length=255), nullable=False),
    sa.Column("diploma_number_hash", sa.String(length=255), nullable=False),
    sa.Column("verification_hash", sa.String(length=64), nullable=False),
    sa.Column("encrypted_payload", sa.Text(), nullable=False),
    sa.Column("digital_signature", sa.Text(), nullable=False),
    sa.Column(
      "status",
      diploma_status,
      nullable=False,
      server_default=sa.text("'VALID'::core.diploma_status"),
    ),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.UniqueConstraint("university_id", "diploma_number_hash", name="uq_university_diploma_number"),
    sa.UniqueConstraint("verification_hash", name="uq_diplomas_verification_hash"),
    schema="core",
  )

  op.create_table(
    "access_tokens",
    sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
    sa.Column("diploma_id", postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column("token_value", sa.String(length=255), nullable=False),
    sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("is_revoked", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.ForeignKeyConstraint(["diploma_id"], ["core.diplomas.id"], ondelete="CASCADE"),
    sa.UniqueConstraint("token_value"),
    schema="core",
  )

  op.create_index(
    "idx_core_access_tokens_val",
    "access_tokens",
    ["token_value"],
    unique=False,
    schema="core",
    postgresql_where=sa.text("is_revoked = false"),
  )


def downgrade() -> None:
  op.drop_index("idx_core_access_tokens_val", table_name="access_tokens", schema="core")
  op.drop_table("access_tokens", schema="core")
  op.drop_table("diplomas", schema="core")
  op.execute(sa.text("DROP TYPE core.diploma_status"))
  op.drop_table("company_limits", schema="auth")
  op.drop_table("api_keys", schema="auth")
  op.drop_table("companies", schema="auth")
  op.drop_table("students", schema="auth")
  op.drop_table("universities", schema="auth")
  op.execute(sa.text("DROP SCHEMA IF EXISTS core CASCADE"))
  op.execute(sa.text("DROP SCHEMA IF EXISTS auth CASCADE"))
