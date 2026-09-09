from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from app.config import settings

router = APIRouter()


@router.get("/whatsapp/webhook")
async def verify_whatsapp(request: Request):
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge", "")
    if mode == "subscribe" and token and token == (settings.whatsapp_verify_token or ""):
        return int(challenge) if challenge.isdigit() else challenge
    raise HTTPException(403, "verify token mismatch")


@router.post("/whatsapp/webhook")
async def whatsapp_status(request: Request) -> dict:
    payload = await request.json()
    return {"ok": True, "received": bool(payload)}
