"""Encrypt document bytes at rest with Fernet."""

from __future__ import annotations

from pathlib import Path

from cryptography.fernet import Fernet

from app.config import settings

_DEV_KEY = b"cHVsc2VidWlsZC1kZXYtZmlsZS1rZXktMzIhbm90LXByb2Q="


def _fernet() -> Fernet:
    raw = (settings.file_encryption_key or "").encode()
    if len(raw) >= 43:
        return Fernet(raw)
    return Fernet(_DEV_KEY)


def encrypt_bytes(data: bytes) -> bytes:
    return _fernet().encrypt(data)


def decrypt_bytes(blob: bytes) -> bytes:
    return _fernet().decrypt(blob)


def write_encrypted(storage_key: str, data: bytes) -> Path:
    path = Path(settings.local_upload_dir) / storage_key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(encrypt_bytes(data))
    return path
