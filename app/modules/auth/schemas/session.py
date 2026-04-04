from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.shared.types.auth import UserTypeEnum


class LoginRequest(BaseModel):
  email: EmailStr
  password: str
  user_type: UserTypeEnum


class LoginResponse(BaseModel):
  access_token: str
  token_type: str = "Bearer"
  expires_in: int
  user_id: UUID
  user_type: UserTypeEnum


class RefreshResponse(BaseModel):
  access_token: str
  token_type: str = "Bearer"
  expires_in: int
