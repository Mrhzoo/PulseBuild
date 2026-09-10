"use client";

import { useEffect, useState } from "react";
import en from "../../../i18n/en.json";
import ar from "../../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function AppBillingPage() {
  const [locale, setLocale] = useState("en");
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const role = typeof window !== "undefined" ? localStorage.getItem("pb_role") || "" : "";
  const owner = role === "owner";
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [flash, setFlash] = useState("");

  async function load() {
    const res = await fetch(`${API}/api/billing/status`, { headers: { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}` } });
    if (res.ok) setStatus(await res.json());
  }
  useEffect(() => {
    setLocale(localStorage.getItem("pb_locale") || "en");
    const q = new URLSearchParams(window.location.search);
    if (q.get("ok")) setFlash("ok");
    if (q.get("canceled")) setFlash("canceled");
    if (q.get("session")) setFlash("stub");
    if (q.get("portal")) setFlash("portal");
    void load();
  }, []);

  async function post(path: string, body: object) {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url.replace("/billing", "/app/billing");
  }

  return (
    <article>
      <h1>{t.billing}</h1>
      <p className="sub">{t.whatsapp_best_effort}</p>
      {flash && <p className="ask-banner">{flash === "canceled" ? t.billing_canceled : t.billing_ok}</p>}
      {status && (
        <div className="dash-card">
          <p>{String(status.plan)} · {String(status.billing_status)} · AED</p>
          <p>{t.projects_quota}: {String(status.projects_used)} / {String(status.project_quota)}</p>
          {status.stub ? <p className="muted">{t.billing_stub}</p> : <p className="muted">Stripe live</p>}
          {owner && (
            <div className="dash-actions">
              <button type="button" onClick={() => void post("/api/billing/checkout", {})}>{t.upgrade}</button>
              <button type="button" onClick={() => void post("/api/billing/checkout", { addon: true })}>{t.project_pack}</button>
              <button type="button" onClick={() => void post("/api/billing/portal", {})}>{t.customer_portal}</button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
