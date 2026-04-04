from __future__ import annotations

import base64
import hashlib
import hmac
import os

import bcrypt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import get_settings


def hash_password(password: str) -> str:
  salt = bcrypt.gensalt()
  return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
  try:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
  except ValueError:
    return False


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
