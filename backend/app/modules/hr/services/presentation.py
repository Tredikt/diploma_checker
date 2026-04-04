from __future__ import annotations

import json
from dataclasses import dataclass
from typing import TYPE_CHECKING

from app.modules.hr.schemas import DiplomaDataFull, DiplomaDataMasked, VerificationResult
from app.shared.cryptography import decrypt_aes
from app.shared.errors import AppError

if TYPE_CHECKING:
  from app.modules.hr.schemas import HrCallerContext, HrDiplomaRecord


@dataclass(slots=True)
class DecryptedDiplomaPayload:
  full_name: str
  specialty: str
  issue_year: int
  diploma_number: str


class HrVerificationPresenter:
  def build_verification_result(
    self,
    diploma: HrDiplomaRecord,
    caller_context: HrCallerContext,
  ) -> VerificationResult:
    payload = self._decrypt_payload(diploma.encrypted_payload)

    if caller_context.can_view_full_data:
      data = DiplomaDataFull(
        status=diploma.status,
        university_name=diploma.university_name,
        full_name=payload.full_name,
        specialty=payload.specialty,
        issue_year=payload.issue_year,
        diploma_number=payload.diploma_number,
      )
    else:
      data = DiplomaDataMasked(
        status=diploma.status,
        university_name=diploma.university_name,
        full_name_masked=self._mask_full_name(payload.full_name),
        specialty=payload.specialty,
        issue_year=payload.issue_year,
      )

    is_valid = diploma.is_valid
    message = "Диплом действителен" if is_valid else "Диплом был аннулирован"
    return VerificationResult(is_valid=is_valid, message=message, data=data)

  @staticmethod
  def _decrypt_payload(encrypted_payload: str) -> DecryptedDiplomaPayload:
    try:
      decrypted_raw = decrypt_aes(encrypted_payload)
      parsed = json.loads(decrypted_raw)
    except Exception as exc:
      raise AppError(
        status_code=500,
        error_code="DECRYPTION_FAILED",
        detail="Could not decrypt diploma payload",
      ) from exc

    return DecryptedDiplomaPayload(
      full_name=str(parsed.get("full_name", "")).strip(),
      specialty=str(parsed.get("specialty", "")).strip(),
      issue_year=int(parsed.get("issue_year", 0)),
      diploma_number=str(parsed.get("diploma_number", "")).strip(),
    )

  @staticmethod
  def _mask_full_name(full_name: str) -> str:
    if not full_name:
      return "***"

    parts = [part for part in full_name.split() if part]
    if not parts:
      return "***"

    masked_last_name = HrVerificationPresenter._mask_word(parts[0])
    initials = " ".join(f"{part[0]}." for part in parts[1:] if part)
    return f"{masked_last_name} {initials}".strip()

  @staticmethod
  def _mask_word(value: str) -> str:
    if len(value) <= 1:
      return "*"
    if len(value) == 2:
      return f"{value[0]}*"
    return f"{value[:2]}{'*' * max(len(value) - 2, 1)}"
