"""Encrypt document bytes at rest with Fernet."""

from __future__ import annotations

from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings

# Valid Fernet key for local development only. Override FILE_ENCRYPTION_KEY everywhere else.
_DEV_KEY = b"QqCH7loflz6-QPlfteLXJTPEs2NPDTvZrxGt7rzVFio="


def _fernet() -> Fernet:
    raw = (settings.file_encryption_key or "").strip().encode()
    if raw:
        try:
            return Fernet(raw)
        except (ValueError, TypeError) as exc:
            if settings.app_env != "development":
                raise RuntimeError("FILE_ENCRYPTION_KEY is not a valid Fernet key") from exc
    if settings.app_env != "development":
        raise RuntimeError("FILE_ENCRYPTION_KEY is required outside development")
    return Fernet(_DEV_KEY)


def encrypt_bytes(data: bytes) -> bytes:
    return _fernet().encrypt(data)


def decrypt_bytes(blob: bytes) -> bytes:
    try:
        return _fernet().decrypt(blob)
    except InvalidToken as exc:
        raise RuntimeError("cannot decrypt blob with current FILE_ENCRYPTION_KEY") from exc


def write_encrypted(storage_key: str, data: bytes) -> Path:
    path = Path(settings.local_upload_dir) / storage_key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(encrypt_bytes(data))
    return path
