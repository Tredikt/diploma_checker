from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class AppError(Exception):
  status_code: int
  error_code: str
  detail: str
