from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


@dataclass
class PortalFile:
    filename: str
    data: bytes
    source_url: str = ""


@dataclass
class SyncResult:
    docs_pulled: int = 0
    errors: list[str] = field(default_factory=list)
    mode: str = "fixture"


class PortalConnector(Protocol):
    async def list_files(self) -> list[PortalFile]: ...
