from __future__ import annotations

import base64
import hashlib
import hmac
import os
from typing import cast

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from passlib.context import CryptContext

from app.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
  return cast(str, pwd_context.hash(password))


def verify_password(password: str, password_hash: str) -> bool:
  return cast(bool, pwd_context.verify(password, password_hash))


def compute_hmac(value: str) -> str:
  settings = get_settings()
  return hmac.new(
    settings.hmac_secret_key.encode("utf-8"),
    value.encode("utf-8"),
    hashlib.sha256,
  ).hexdigest()


def hash_token(value: str) -> str:
  return hashlib.sha256(value.encode("utf-8")).hexdigest()


def encrypt_aes(value: str) -> str:
  settings = get_settings()
  nonce = os.urandom(12)
  aesgcm = AESGCM(settings.aes_key_bytes)
  ciphertext = aesgcm.encrypt(nonce, value.encode("utf-8"), None)
  return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt_aes(value: str) -> str:
  settings = get_settings()
  raw = base64.b64decode(value)
  nonce = raw[:12]
  ciphertext = raw[12:]
  aesgcm = AESGCM(settings.aes_key_bytes)
  plaintext = aesgcm.decrypt(nonce, ciphertext, None)
  return plaintext.decode("utf-8")
