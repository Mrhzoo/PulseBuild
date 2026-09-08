from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.deps import Principal, require_write
from app.digest.payload import coaching_ask
from app.ingest.types import detect_language
from app.models.orm import Role
from app.services.assisted_ops import over_cap
from app.services.usage import allow_tokens, remaining


def test_token_cap_blocks_overspend():
    assert allow_tokens(used=249_000, incoming=500, cap=250_000) is True
    assert allow_tokens(used=249_900, incoming=500, cap=250_000) is False
    assert remaining(250_000, 250_000) == 0


def test_assisted_ops_cap():
    assert over_cap(used=29, incoming=1, cap=30) is False
    assert over_cap(used=30, incoming=1, cap=30) is True


def test_reader_blocked_from_assisted_write():
    with pytest.raises(HTTPException) as exc:
        require_write(Principal(uuid4(), uuid4(), Role.READER))
    assert exc.value.status_code == 403


def test_coaching_empty_and_unassigned():
    assert "need a project" in coaching_ask(2, ["Marina"], False)
    ask = coaching_ask(0, ["Marina"], False)
    assert ask and "IPC" in ask
    assert coaching_ask(0, ["Marina"], True) is None


def test_mixed_arabic_does_not_crash_language():
    assert detect_language("Delay confirmed. يوجد تأخير في البرنامج.") == "mixed"
