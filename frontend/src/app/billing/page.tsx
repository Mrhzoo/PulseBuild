"use client";

import { useEffect, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function BillingPage() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const locale = typeof window !== "undefined" ? localStorage.getItem("pb_locale") || "en" : "en";
  const t = locale === "ar" ? ar : en;
  useEffect(() => {
    const token = localStorage.getItem("pb_token") || "";
    void fetch(`${API}/api/billing/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus);
  }, []);
  async function checkout(addon = false) {
    const token = localStorage.getItem("pb_token") || "";
    const res = await fetch(`${API}/api/billing/checkout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ addon }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }
  return (
    <>
      <h1>{t.billing}</h1>
      <p className="sub">{t.whatsapp_best_effort}</p>
      {status && (
        <div className="card">
          <p>Plan: {String(status.plan)} · {String(status.billing_status)} · AED</p>
          <p>{t.projects_quota}: {String(status.projects_used)} / {String(status.project_quota)}</p>
          <p className="muted">{status.stub ? "Stub checkout (no live charge)" : "Stripe live"}</p>
          <button type="button" onClick={() => void checkout(false)}>{t.upgrade}</button>{" "}
          <button type="button" onClick={() => void checkout(true)}>+ projects pack</button>
        </div>
      )}
    </>
  );
}
