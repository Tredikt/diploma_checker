from __future__ import annotations

import base64
import hashlib
import hmac
import os
import uuid

import bcrypt
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
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


def derive_university_signing_private_key(university_id: uuid.UUID) -> ec.EllipticCurvePrivateKey:
  settings = get_settings()
  seed = hmac.new(
    settings.hmac_secret_key.encode("utf-8"),
    str(university_id).encode("utf-8"),
    hashlib.sha256,
  ).digest()
  curve = ec.SECP256R1()
  order = curve.order
  private_int = int.from_bytes(seed, "big") % (order - 1) + 1
  return ec.derive_private_key(private_int, curve)


def university_signing_public_key_pem(university_id: uuid.UUID) -> str:
  private_key = derive_university_signing_private_key(university_id)
  public_key = private_key.public_key()
  pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo,
  )
  return pem.decode("utf-8")


def sign_diploma_payload(message: bytes, university_id: uuid.UUID) -> str:
  private_key = derive_university_signing_private_key(university_id)
  signature = private_key.sign(message, ec.ECDSA(hashes.SHA256()))
  return base64.b64encode(signature).decode("utf-8")
