from __future__ import annotations

import io
import uuid

from httpx import AsyncClient

from tests.support import register_and_verify_university, university_access_headers


async def test_university_diplomas_requires_auth(client: AsyncClient) -> None:
  response = await client.get("/university/diplomas")
  assert response.status_code == 401


async def test_university_create_list_get_revoke_import(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  await register_and_verify_university(client, email=unique_email, password=strong_password)
  headers = await university_access_headers(client, email=unique_email, password=strong_password)

  created = await client.post(
    "/university/diplomas",
    headers=headers,
    json={
      "full_name": "Сидоров Сидор",
      "year": 2021,
      "specialty": "Прикладная математика",
      "diploma_number": f"SN-{uuid.uuid4().hex[:6]}",
    },
  )
  assert created.status_code == 200
  created_body = created.json()
  verification_hash = created_body["verification_hash"]
  assert created_body["status"] == "valid"

  listed_response = await client.get(
    "/university/diplomas",
    headers=headers,
    params={"limit": 10, "offset": 0},
  )
  assert listed_response.status_code == 200
  listed = listed_response.json()
  assert listed["total"] >= 1
  assert any(item["verification_hash"] == verification_hash for item in listed["items"])

  detail_response = await client.get(f"/university/diplomas/{verification_hash}", headers=headers)
  assert detail_response.status_code == 200
  detail = detail_response.json()
  assert detail["verification_hash"] == verification_hash
  assert detail["status"] == "valid"
  assert "Сидоров" in detail["full_name"]

  csv_bytes = ("ФИО,год,специальность,номер диплома\nИванов Иван,2022,Физика,CSV-001\n").encode("utf-8-sig")
  files = {"file": ("import.csv", io.BytesIO(csv_bytes), "text/csv")}
  import_response = await client.post("/university/diplomas/import", headers=headers, files=files)
  assert import_response.status_code == 200
  import_body = import_response.json()
  assert import_body["created"] >= 1
  assert isinstance(import_body["errors"], list)

  revoke_response = await client.post(
    f"/university/diplomas/{verification_hash}/revoke",
    headers=headers,
  )
  assert revoke_response.status_code == 200
  assert revoke_response.json()["status"] == "annulled"

  after_revoke = await client.get(f"/university/diplomas/{verification_hash}", headers=headers)
  assert after_revoke.status_code == 200
  assert after_revoke.json()["status"] == "annulled"


async def test_university_import_unsupported_file(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  await register_and_verify_university(client, email=unique_email, password=strong_password)
  headers = await university_access_headers(client, email=unique_email, password=strong_password)
  files = {"file": ("x.txt", io.BytesIO(b"x"), "text/plain")}
  response = await client.post("/university/diplomas/import", headers=headers, files=files)
  assert response.status_code == 400
  assert response.json()["error_code"] == "UNSUPPORTED_FILE"


async def test_university_get_unknown_hash(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  await register_and_verify_university(client, email=unique_email, password=strong_password)
  headers = await university_access_headers(client, email=unique_email, password=strong_password)
  unknown_hash = "a" * 64
  response = await client.get(f"/university/diplomas/{unknown_hash}", headers=headers)
  assert response.status_code == 404


async def test_university_create_validation(
  client: AsyncClient,
  unique_email: str,
  strong_password: str,
) -> None:
  await register_and_verify_university(client, email=unique_email, password=strong_password)
  headers = await university_access_headers(client, email=unique_email, password=strong_password)
  response = await client.post(
    "/university/diplomas",
    headers=headers,
    json={
      "full_name": "Иванов Иван",
      "year": 1890,
      "specialty": "X",
      "diploma_number": "1",
    },
  )
  assert response.status_code == 422
