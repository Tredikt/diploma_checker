from __future__ import annotations

import uuid

from httpx import AsyncClient

from tests.support import (
  company_access_headers,
  register_and_verify_company,
  register_and_verify_university,
  set_cookie_values,
  university_access_headers,
)


async def test_register_university(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  response = await client.post(
    "/auth/register/university",
    json={
      "code": f"U_{uuid.uuid4().hex[:10]}",
      "name": "Vuz",
      "email": unique_email,
      "password": strong_password,
      "public_key": None,
    },
  )
  assert response.status_code == 201
  body = response.json()
  assert "user_id" in body
  assert body["is_verified"] is False


async def test_register_company(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  response = await client.post(
    "/auth/register/company",
    json={"company_name": "Org", "email": unique_email, "password": strong_password},
  )
  assert response.status_code == 201
  assert response.json()["is_verified"] is False


async def test_register_duplicate_university_conflict(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  code = f"DU_{uuid.uuid4().hex[:8]}"
  payload = {
    "code": code,
    "name": "Vuz",
    "email": unique_email,
    "password": strong_password,
    "public_key": None,
  }
  first = await client.post("/auth/register/university", json=payload)
  assert first.status_code == 201
  duplicate = await client.post("/auth/register/university", json=payload)
  assert duplicate.status_code == 409
  assert duplicate.json()["error_code"] == "CONFLICT"


async def test_login_unverified_university_forbidden(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  await client.post(
    "/auth/register/university",
    json={
      "code": f"UV_{uuid.uuid4().hex[:8]}",
      "name": "Vuz",
      "email": unique_email,
      "password": strong_password,
    },
  )
  response = await client.post(
    "/auth/login",
    json={"email": unique_email, "password": strong_password, "user_type": "university"},
  )
  assert response.status_code == 403
  assert response.json()["error_code"] == "FORBIDDEN"


async def test_login_wrong_password_unauthorized(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  await register_and_verify_university(client, email=unique_email, password=strong_password)
  response = await client.post(
    "/auth/login",
    json={"email": unique_email, "password": "wrongpassword999", "user_type": "university"},
  )
  assert response.status_code == 401
  assert response.json()["error_code"] == "UNAUTHORIZED"


async def test_login_success_university(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  await register_and_verify_university(client, email=unique_email, password=strong_password)
  response = await client.post(
    "/auth/login",
    json={"email": unique_email, "password": strong_password, "user_type": "university"},
  )
  assert response.status_code == 200
  body = response.json()
  assert body["token_type"] == "Bearer"
  assert body["access_token"]
  assert body["user_type"] == "university"


async def test_refresh_requires_cookie(client: AsyncClient) -> None:
  response = await client.post("/auth/refresh")
  assert response.status_code == 401
  assert response.json()["error_code"] == "UNAUTHORIZED"


async def test_refresh_with_cookie(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  await register_and_verify_university(client, email=unique_email, password=strong_password)
  login = await client.post(
    "/auth/login",
    json={"email": unique_email, "password": strong_password, "user_type": "university"},
  )
  assert login.status_code == 200
  cookies_header = set_cookie_values(login)
  refresh = next((c for c in cookies_header if "refresh_token=" in c), None)
  assert refresh is not None

  refreshed = await client.post("/auth/refresh")
  assert refreshed.status_code == 200
  refreshed_body = refreshed.json()
  assert refreshed_body["access_token"]
  assert refreshed_body["token_type"] == "Bearer"


async def test_register_student_without_diploma_conflict(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  response = await client.post(
    "/auth/register/student",
    json={
      "email": unique_email,
      "password": strong_password,
      "last_name": "Иванов",
      "first_name": "Иван",
      "patronymic": None,
      "diploma_number": "NO-SUCH-DIP",
    },
  )
  assert response.status_code == 409
  assert response.json()["error_code"] == "CONFLICT"


async def test_register_student_after_diploma_created(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  u_email = f"univ_{uuid.uuid4().hex[:10]}@example.com"
  stud_email = unique_email
  await register_and_verify_university(client, email=u_email, password=strong_password)
  headers = await university_access_headers(client, email=u_email, password=strong_password)
  dip_num = f"DIP-{uuid.uuid4().hex[:8]}"
  created = await client.post(
    "/university/diplomas",
    headers=headers,
    json={
      "full_name": "Петров Пётр Петрович",
      "year": 2020,
      "specialty": "Информатика",
      "diploma_number": dip_num,
    },
  )
  assert created.status_code == 200

  registered = await client.post(
    "/auth/register/student",
    json={
      "email": stud_email,
      "password": strong_password,
      "last_name": "Петров",
      "first_name": "Пётр",
      "patronymic": "Петрович",
      "diploma_number": dip_num,
    },
  )
  assert registered.status_code == 201
  assert registered.json()["is_verified"] is True


async def test_auth_me_requires_bearer(client: AsyncClient) -> None:
  response = await client.get("/auth/me")
  assert response.status_code == 401


async def test_auth_me_university_profile(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  await register_and_verify_university(client, email=unique_email, password=strong_password)
  headers = await university_access_headers(client, email=unique_email, password=strong_password)
  response = await client.get("/auth/me", headers=headers)
  assert response.status_code == 200
  body = response.json()
  assert body["email"] == unique_email
  assert "code" in body and body["code"]


async def test_auth_me_company_profile(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  await register_and_verify_company(client, email=unique_email, password=strong_password)
  headers = await company_access_headers(client, email=unique_email, password=strong_password)
  response = await client.get("/auth/me", headers=headers)
  assert response.status_code == 200
  body = response.json()
  assert body["email"] == unique_email
  assert "company_name" in body


async def test_company_endpoints_forbidden_for_university(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  await register_and_verify_university(client, email=unique_email, password=strong_password)
  headers = await university_access_headers(client, email=unique_email, password=strong_password)
  response = await client.get("/auth/companies/api-keys", headers=headers)
  assert response.status_code == 403


async def test_company_api_keys_list_create_delete_limits(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  company_id = await register_and_verify_company(client, email=unique_email, password=strong_password)
  headers = await company_access_headers(client, email=unique_email, password=strong_password)

  empty = await client.get("/auth/companies/api-keys", headers=headers)
  assert empty.status_code == 200
  assert empty.json()["items"] == []

  created = await client.post(
    "/auth/companies/api-keys",
    headers=headers,
    json={"key_label": "pytest"},
  )
  assert created.status_code == 201
  key_body = created.json()
  key_id = key_body["id"]
  assert key_body["key"]

  listed = await client.get("/auth/companies/api-keys", headers=headers)
  assert listed.status_code == 200
  assert len(listed.json()["items"]) == 1

  limits = await client.get("/auth/companies/limits", headers=headers)
  assert limits.status_code == 200
  limits_body = limits.json()
  assert "monthly_quota" in limits_body
  assert str(limits_body["company_id"]) == str(company_id)

  deleted = await client.delete(f"/auth/companies/api-keys/{key_id}", headers=headers)
  assert deleted.status_code == 204
