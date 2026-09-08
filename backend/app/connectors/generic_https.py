from __future__ import annotations

from pathlib import Path

import httpx

from app.connectors.base import PortalFile, SyncResult
from app.config import settings

FIXTURES = Path(__file__).resolve().parent / "fixtures"


class GenericHttpsPortalConnector:
    def __init__(self, base_url: str = "", api_key: str = ""):
        self.base_url = (base_url or settings.portal_base_url or "").rstrip("/")
        self.api_key = api_key or settings.portal_api_key

    async def list_files(self) -> list[PortalFile]:
        if not self.base_url:
            return self._fixtures()
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(self.base_url, headers=headers)
            response.raise_for_status()
            payload = response.json()
        files: list[PortalFile] = []
        items = payload if isinstance(payload, list) else payload.get("documents") or payload.get("files") or []
        for item in items[:20]:
            url = item.get("url") or item.get("href")
            name = item.get("filename") or item.get("name") or "portal.bin"
            if not url:
                continue
            async with httpx.AsyncClient(timeout=30) as client:
                raw = await client.get(url, headers=headers)
                raw.raise_for_status()
                files.append(PortalFile(filename=name, data=raw.content, source_url=url))
        return files

    def _fixtures(self) -> list[PortalFile]:
        out = []
        if not FIXTURES.exists():
            return out
        for path in sorted(FIXTURES.iterdir()):
            if path.is_file() and not path.name.startswith("."):
                out.append(PortalFile(filename=path.name, data=path.read_bytes(), source_url=f"fixture://{path.name}"))
        return out


async def collect(base_url: str = "", api_key: str = "") -> tuple[list[PortalFile], SyncResult]:
    connector = GenericHttpsPortalConnector(base_url, api_key)
    try:
        files = await connector.list_files()
        return files, SyncResult(docs_pulled=len(files), mode="live" if connector.base_url else "fixture")
    except Exception as exc:
        return [], SyncResult(docs_pulled=0, errors=[str(exc)], mode="error")
