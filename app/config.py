from __future__ import annotations

import base64
from functools import lru_cache
from typing import Literal

from pydantic import Field, ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
  
  host: str = Field(default="0.0.0.0", alias="HOST")
  port: int = Field(default=8000, alias="PORT")

  app_env: Literal["development", "production"] = "development"
  database_url: str = Field(alias="DATABASE_URL")
  database_pool_size: int = Field(default=10, alias="DATABASE_POOL_SIZE")
  redis_url: str = Field(alias="REDIS_URL")

  jwt_secret_key: str = Field(alias="JWT_SECRET_KEY")
  jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
  access_token_expire_minutes: int = Field(default=15, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
  refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

  aes_encryption_key: str = Field(alias="AES_ENCRYPTION_KEY")
  hmac_secret_key: str = Field(alias="HMAC_SECRET_KEY")

  cors_origins: list[str] = Field(default_factory=list, alias="CORS_ORIGINS")
  public_rate_limit_per_minute: int = Field(default=20, alias="PUBLIC_RATE_LIMIT_PER_MINUTE")
  b2b_rate_limit_per_minute: int = Field(default=100, alias="B2B_RATE_LIMIT_PER_MINUTE")
  
  companty_monthly_quota: int = Field(default=1000, alias="COMPANY_MONTHLY_QUOTA")

  @field_validator("jwt_secret_key", "hmac_secret_key")
  @classmethod
  def _validate_secret_strength(cls, value: str) -> str:
    if len(value.strip()) < 16:
      raise ValueError("Secret must be at least 16 chars")
    return value

  @field_validator("aes_encryption_key")
  @classmethod
  def _validate_aes_key(cls, value: str) -> str:
    try:
      decoded = base64.b64decode(value)
    except Exception as exc:
      raise ValueError("AES_ENCRYPTION_KEY must be valid base64") from exc
    if len(decoded) != 32:
      raise ValueError("AES_ENCRYPTION_KEY must decode to exactly 32 bytes")
    return value

  @property
  def aes_key_bytes(self) -> bytes:
    return base64.b64decode(self.aes_encryption_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
  try:
    return Settings()
  except ValidationError as exc:
    raise RuntimeError(f"Invalid application settings: {exc}") from exc
