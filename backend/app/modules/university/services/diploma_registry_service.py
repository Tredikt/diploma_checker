from __future__ import annotations

import json
import secrets
import uuid
from typing import Literal

from redis.asyncio import Redis
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import University
from app.modules.university.repositories import DiplomaRegistryRepository, UniversityAccountRepository
from app.modules.university.schemas import (
  DiplomaCreatedResponse,
  DiplomaCreateRequest,
  DiplomaDetailResponse,
  DiplomaImportResponse,
  DiplomaListItem,
  DiplomaListResponse,
  ImportRowError,
  RevokeDiplomaResponse,
)
from app.shared.cryptography import (
  compute_hmac,
  decrypt_aes,
  encrypt_aes,
  sign_diploma_payload,
  university_signing_public_key_pem,
)
from app.shared.errors import AppError
from app.shared.models import Diploma

VERIFICATION_CACHE_PREFIX = "diploma:verify:"


def _split_fio(fio: str) -> tuple[str, str, str | None]:
  parts = fio.strip().split()
  if len(parts) < 2:
    msg = "ФИО: укажите как минимум фамилию и имя"
    raise ValueError(msg)
  last, first = parts[0], parts[1]
  patronymic = " ".join(parts[2:]).strip() or None
  if not last or not first:
    msg = "ФИО: фамилия и имя не могут быть пустыми"
    raise ValueError(msg)
  return last, first, patronymic


def _status_to_api(db_status: str) -> Literal["valid", "annulled"]:
  if db_status == "REVOKED":
    return "annulled"
  return "valid"


class DiplomaRegistryService:
  def __init__(self, session: AsyncSession, redis: Redis) -> None:
    self.session = session
    self.redis = redis
    self.diplomas = DiplomaRegistryRepository(session)
    self.universities = UniversityAccountRepository(session)

  async def _ensure_signing_public_key(self, university_id: uuid.UUID) -> None:
    university = await self.universities.get_by_id(university_id)
    if university is None:
      raise AppError(status_code=404, error_code="UNIVERSITY_NOT_FOUND", detail="Вуз не найден")
    derived_pem = university_signing_public_key_pem(university_id)
    if university.public_key is None:
      await self.universities.update_many(
        filters=[University.id == university_id],
        values={"public_key": derived_pem},
      )
    elif university.public_key.strip() != derived_pem.strip():
      raise AppError(
        status_code=400,
        error_code="UNIVERSITY_SIGNING_KEY_MISMATCH",
        detail=(
          "Сохранённый public_key вуза не совпадает с ключом подписи реестра. "
          "Очистите поле или согласуйте ключ с платформой."
        ),
      )

  def _build_diploma(
    self,
    university_id: uuid.UUID,
    full_name: str,
    year: int,
    specialty: str,
    diploma_number: str,
  ) -> Diploma:
    last, first, patronymic = _split_fio(full_name)
    verification_hash = secrets.token_hex(32)
    number_hash = compute_hmac(diploma_number)
    payload = json.dumps(
      {
        "full_name": full_name,
        "specialty": specialty,
        "year": year,
        "diploma_number": diploma_number,
      },
      ensure_ascii=False,
    )
    encrypted_payload = encrypt_aes(payload)
    message = f"{verification_hash}\n{university_id}\n{number_hash}".encode()
    signature = sign_diploma_payload(message, university_id)
    return Diploma(
      university_id=university_id,
      student_id=None,
      last_name_hash=compute_hmac(last),
      first_name_hash=compute_hmac(first),
      patronymic_hash=compute_hmac(patronymic) if patronymic else None,
      graduation_year=year,
      specialty_hash=compute_hmac(specialty),
      diploma_number_hash=number_hash,
      verification_hash=verification_hash,
      encrypted_payload=encrypted_payload,
      digital_signature=signature,
      status="VALID",
    )

  @staticmethod
  def _ensure_import_columns(rows: list[dict[str, str]]) -> None:
    sample = next((r for r in rows if any((v or "").strip() for v in r.values())), None)
    if sample is None:
      raise AppError(
        status_code=400,
        error_code="EMPTY_FILE",
        detail="Файл не содержит строк с данными",
      )
    required = ("full_name", "year", "specialty", "diploma_number")
    missing = [key for key in required if key not in sample]
    if missing:
      raise AppError(
        status_code=400,
        error_code="MISSING_COLUMNS",
        detail="Не удалось сопоставить колонки ФИО, год, специальность и номер диплома. Проверьте заголовки файла.",
      )

  @staticmethod
  def _parse_row(row: dict[str, str]) -> tuple[str, int, str, str]:
    full_name = row.get("full_name", "").strip()
    year_raw = row.get("year", "").strip()
    specialty = row.get("specialty", "").strip()
    diploma_number = row.get("diploma_number", "").strip()
    if not full_name or not year_raw or not specialty or not diploma_number:
      msg = "Заполните ФИО, год, специальность и номер диплома"
      raise ValueError(msg)
    try:
      year = int(float(year_raw))
    except ValueError as exc:
      msg = "Некорректный год"
      raise ValueError(msg) from exc
    if year < 1950 or year > 2100:
      msg = "Год вне допустимого диапазона"
      raise ValueError(msg)
    return full_name, year, specialty, diploma_number

  async def create_one(
    self,
    university_id: uuid.UUID,
    payload: DiplomaCreateRequest,
  ) -> DiplomaCreatedResponse:
    await self._ensure_signing_public_key(university_id)
    diploma = self._build_diploma(
      university_id,
      payload.full_name,
      payload.year,
      payload.specialty,
      payload.diploma_number,
    )
    try:
      async with self.session.begin_nested():
        await self.diplomas.add(diploma)
    except IntegrityError as exc:
      raise AppError(
        status_code=409,
        error_code="DIPLOMA_NUMBER_CONFLICT",
        detail="Запись с таким номером диплома уже существует",
      ) from exc

    return DiplomaCreatedResponse(
      id=diploma.id,
      verification_hash=diploma.verification_hash,
      status="valid",
    )

  async def import_rows(self, university_id: uuid.UUID, rows: list[dict[str, str]]) -> DiplomaImportResponse:
    await self._ensure_signing_public_key(university_id)
    self._ensure_import_columns(rows)
    created = 0
    errors: list[ImportRowError] = []
    for idx, row in enumerate(rows, start=2):
      if not any((v or "").strip() for v in row.values()):
        continue
      try:
        full_name, year, specialty, diploma_number = self._parse_row(row)
      except ValueError as exc:
        errors.append(ImportRowError(row_number=idx, detail=str(exc)))
        continue
      diploma = self._build_diploma(university_id, full_name, year, specialty, diploma_number)
      try:
        async with self.session.begin_nested():
          await self.diplomas.add(diploma)
      except IntegrityError:
        errors.append(
          ImportRowError(row_number=idx, detail="Дубликат номера диплома для этого вуза"),
        )
        continue
      created += 1
    return DiplomaImportResponse(created=created, errors=errors)

  async def list_diplomas(
    self,
    university_id: uuid.UUID,
    *,
    limit: int,
    offset: int,
  ) -> DiplomaListResponse:
    total = await self.diplomas.count_for_university(university_id)
    items = await self.diplomas.list_for_university(university_id, limit=limit, offset=offset)
    return DiplomaListResponse(
      items=[
        DiplomaListItem(
          id=row.id,
          verification_hash=row.verification_hash,
          graduation_year=row.graduation_year,
          status=_status_to_api(row.status),
        )
        for row in items
      ],
      total=total,
      limit=limit,
      offset=offset,
    )

  async def get_detail(self, university_id: uuid.UUID, verification_hash: str) -> DiplomaDetailResponse:
    row = await self.diplomas.get_by_verification_hash_for_university(university_id, verification_hash)
    if row is None:
      raise AppError(status_code=404, error_code="DIPLOMA_NOT_FOUND", detail="Запись не найдена")
    raw = json.loads(decrypt_aes(row.encrypted_payload))
    return DiplomaDetailResponse(
      id=row.id,
      verification_hash=row.verification_hash,
      graduation_year=row.graduation_year,
      status=_status_to_api(row.status),
      full_name=str(raw["full_name"]),
      specialty=str(raw["specialty"]),
      diploma_number=str(raw.get("diploma_number", "")),
    )

  async def revoke(self, university_id: uuid.UUID, verification_hash: str) -> RevokeDiplomaResponse:
    updated = await self.diplomas.update_many(
      filters=[
        Diploma.university_id == university_id,
        Diploma.verification_hash == verification_hash,
        Diploma.status == "VALID",
      ],
      values={"status": "REVOKED"},
    )
    if updated == 0:
      raise AppError(
        status_code=404,
        error_code="DIPLOMA_NOT_FOUND",
        detail="Активная запись не найдена или уже аннулирована",
      )
    await self.redis.delete(f"{VERIFICATION_CACHE_PREFIX}{verification_hash}")
    return RevokeDiplomaResponse(verification_hash=verification_hash, status="annulled")
