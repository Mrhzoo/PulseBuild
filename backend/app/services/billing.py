"""AED pilot billing. Stripe live only with keys; otherwise explicit stub."""

from __future__ import annotations

import hashlib
import hmac
import time
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.orm import Project, Tenant

HARD_STATUSES = frozenset({"active", "past_due"})


def stripe_live() -> bool:
    return bool((settings.stripe_secret_key or "").strip()) and not settings.billing_stub and settings.app_env != "development"


async def project_count(session: AsyncSession, tenant_id: UUID) -> int:
    return int((await session.execute(select(func.count()).select_from(Project).where(Project.tenant_id == tenant_id))).scalar_one() or 0)


async def enforce_project_quota(session: AsyncSession, tenant: Tenant) -> None:
    quota = int(getattr(tenant, "project_quota", None) or 3)
    used = await project_count(session, tenant.id)
    status = getattr(tenant, "billing_status", None) or "trialing"
    if used >= quota and status in HARD_STATUSES:
        raise HTTPException(402, f"Project quota reached ({used}/{quota}). Add a pack or upgrade.")


def verify_stripe_signature(payload: bytes, header: str, secret: str, tolerance: int = 300) -> bool:
    if not header or not secret:
        return False
    parts = dict(item.split("=", 1) for item in header.split(",") if "=" in item)
    timestamp = parts.get("t")
    signature = parts.get("v1")
    if not timestamp or not signature:
        return False
    try:
        if abs(time.time() - int(timestamp)) > tolerance:
            return False
    except ValueError:
        return False
    expected = hmac.new(secret.encode(), f"{timestamp}.".encode() + payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def apply_subscription_event(tenant: Tenant, event_type: str, data: dict) -> None:
    obj = data.get("object") or data
    if event_type == "invoice.payment_failed":
        tenant.billing_status = "past_due"
        return
    if event_type.startswith("customer.subscription.") or event_type == "checkout.session.completed":
        status = obj.get("status") or obj.get("payment_status")
        sub_id = obj.get("subscription") or obj.get("id")
        customer = obj.get("customer")
        if customer:
            tenant.stripe_customer_id = str(customer)
        if sub_id and event_type != "checkout.session.completed":
            tenant.stripe_subscription_id = str(sub_id)
        if event_type == "customer.subscription.deleted" or status in {"canceled", "cancelled"}:
            tenant.billing_status = "canceled"
        elif status in {"active", "paid", "complete"}:
            tenant.billing_status = "active"
        elif status == "past_due":
            tenant.billing_status = "past_due"
        elif status == "trialing":
            tenant.billing_status = "trialing"
