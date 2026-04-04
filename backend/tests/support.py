from __future__ import annotations

import os
import uuid

from httpx import AsyncClient, Response
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


def set_cookie_values(response: Response) -> list[str]:
  values: list[str] = []
  for key, value in response.headers.multi_items():
    if key.lower() == "set-cookie":
      values.append(value)
  return values


async def register_and_verify_university(
  client: AsyncClient,
  *,
  email: str,
  password: str,
  code: str | None = None,
) -> str:
  univ_code = code or f"UNIV_{uuid.uuid4().hex[:8]}"
  registered = await client.post(
    "/auth/register/university",
    json={
      "code": univ_code,
      "name": "Test University",
      "email": email,
      "password": password,
      "public_key": None,
    },
  )
  assert registered.status_code == 201, registered.text
  user_id = str(registered.json()["user_id"])

  engine = create_async_engine(os.environ["DATABASE_URL"])
  async with engine.begin() as conn:
    await conn.execute(
      text("UPDATE auth.universities SET is_verified = true WHERE id = CAST(:id AS uuid)"),
      {"id": user_id},
    )
  await engine.dispose()
  return user_id


async def university_access_headers(client: AsyncClient, *, email: str, password: str) -> dict[str, str]:
  logged_in = await client.post(
    "/auth/login",
    json={"email": email, "password": password, "user_type": "university"},
  )
  assert logged_in.status_code == 200, logged_in.text
  token = logged_in.json()["access_token"]
  return {"Authorization": f"Bearer {token}"}


async def register_and_verify_company(
  client: AsyncClient,
  *,
  email: str,
  password: str,
) -> str:
  registered = await client.post(
    "/auth/register/company",
    json={"company_name": "ACME", "email": email, "password": password},
  )
  assert registered.status_code == 201, registered.text
  user_id = str(registered.json()["user_id"])

  engine = create_async_engine(os.environ["DATABASE_URL"])
  async with engine.begin() as conn:
    await conn.execute(
      text("UPDATE auth.companies SET is_verified = true WHERE id = CAST(:id AS uuid)"),
      {"id": user_id},
    )
  await engine.dispose()
  return user_id


async def company_access_headers(client: AsyncClient, *, email: str, password: str) -> dict[str, str]:
  logged_in = await client.post(
    "/auth/login",
    json={"email": email, "password": password, "user_type": "company"},
  )
  assert logged_in.status_code == 200, logged_in.text
  token = logged_in.json()["access_token"]
  return {"Authorization": f"Bearer {token}"}
