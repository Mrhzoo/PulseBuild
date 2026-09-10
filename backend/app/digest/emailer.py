"""Postmark when token is set; otherwise a local stub in development."""

from __future__ import annotations

from pathlib import Path

import httpx

from app.config import settings
from app.digest.payload import DigestPayload, resolve_locale, subject_line


def _copy(locale: str) -> dict[str, str]:
    if locale == "ar":
        return {
            "promise": "الإحاطة الصباحية عبر البريد.",
            "quiet": "صباح هادئ. لا بنود إجراء.",
            "quiet_label": "هادئ",
            "open": "افتح الملخص",
            "scanned": "مشاريع مراجعة",
            "ask_fallback": "لا شيء للتعيين.",
        }
    return {
        "promise": "Morning briefing by email.",
        "quiet": "Quiet morning. No Act items.",
        "quiet_label": "Quiet",
        "open": "Open digest",
        "scanned": "projects scanned",
        "ask_fallback": "Nothing to assign.",
    }


def _html(payload: DigestPayload) -> str:
    locale = resolve_locale(payload)
    c = _copy(locale)
    home = settings.web_base_url.rstrip("/")
    cards = ""
    for card in payload.act + payload.watch:
        pct = round(card.confidence * 100)
        cards += (
            f"<h3>{card.severity.upper()} · {card.project_name}</h3>"
            f"<p><strong>{card.title}</strong></p>"
            f"<p>{card.why_it_hits_us}</p>"
            f"<p style='color:#5c6b7a;font-size:13px'>{card.evidence_snippet} · {card.evidence_pointer} · {pct}%</p>"
        )
    quiet = ", ".join(payload.quiet_projects) or "—"
    ask = payload.ask or c["ask_fallback"]
    direction = "rtl" if locale == "ar" else "ltr"
    return f"""<!doctype html>
<html lang="{locale}" dir="{direction}"><body style="font-family:Georgia,serif;color:#1a2330">
<p>{c["promise"]}</p>
<p>{payload.company} · {payload.date} · {payload.projects_scanned} {c["scanned"]}.</p>
{cards or f"<p>{c['quiet']}</p>"}
<p>{c["quiet_label"]}: {quiet}</p>
<p>{ask}</p>
<p><a href="{home}">{c["open"]}</a></p>
</body></html>"""


def _text(payload: DigestPayload) -> str:
    locale = resolve_locale(payload)
    c = _copy(locale)
    lines = [c["promise"], f"{payload.company} · {payload.date}"]
    for card in payload.act + payload.watch:
        lines.append(f"- {card.severity.upper()} {card.project_name}: {card.title} ({round(card.confidence * 100)}% · {card.evidence_pointer})")
    if not payload.act and not payload.watch:
        lines.append(c["quiet"])
    if payload.quiet_projects:
        lines.append(f"{c['quiet_label']}: " + ", ".join(payload.quiet_projects))
    if payload.ask:
        lines.append(payload.ask)
    lines.append(settings.web_base_url)
    return "\n".join(lines)


def write_stub(payload: DigestPayload, recipients: list[str]) -> Path:
    folder = Path(settings.local_upload_dir).resolve().parent / "digests"
    folder.mkdir(parents=True, exist_ok=True)
    stem = f"{payload.date}-{payload.digest_id or 'preview'}"
    html_path = folder / f"{stem}.html"
    eml_path = folder / f"{stem}.eml"
    html = _html(payload)
    html_path.write_text(html, encoding="utf-8")
    eml_path.write_text(
        f"From: {settings.mail_from}\nTo: {', '.join(recipients)}\nSubject: {subject_line(payload)}\nContent-Type: text/html; charset=utf-8\n\n{html}",
        encoding="utf-8",
    )
    return eml_path


async def send_digest_email(payload: DigestPayload, recipients: list[str]) -> str:
    if not recipients:
        raise RuntimeError("no recipients")
    token = (settings.postmark_server_token or "").strip()
    if token:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                "https://api.postmarkapp.com/email",
                headers={"Accept": "application/json", "Content-Type": "application/json", "X-Postmark-Server-Token": token},
                json={"From": settings.mail_from, "To": ", ".join(recipients), "Subject": subject_line(payload), "HtmlBody": _html(payload), "TextBody": _text(payload), "MessageStream": "outbound"},
            )
            response.raise_for_status()
        return "email"
    if settings.app_env == "development":
        write_stub(payload, recipients)
        return "stub"
    raise RuntimeError("POSTMARK_SERVER_TOKEN missing; refusing to pretend the briefing was sent")
