"use client";

import { useEffect, useState } from "react";
import AppPage from "../../../components/motion/AppPage";
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
  const [err, setErr] = useState(false);
  const [actionErr, setActionErr] = useState("");

  async function load() {
    setErr(false);
    const res = await fetch(`${API}/api/billing/status`, { headers: { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}` } });
    if (res.ok) setStatus(await res.json());
    else setErr(true);
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
    setActionErr("");
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 503) {
      setActionErr(t.billing_not_configured);
      return;
    }
    if (!res.ok) {
      setActionErr(t.billing_retry);
      return;
    }
    if (data.url) window.location.href = data.url.replace("/billing", "/app/billing");
  }

  const notConfigured = Boolean(status?.billing_not_configured);
  const used = Number(status?.projects_used || 0);
  const quota = Number(status?.project_quota || 1);
  const pct = Math.min(100, Math.round((used / Math.max(quota, 1)) * 100));

  return (
    <AppPage as="article">
      <h1>{t.billing}</h1>
      <p className="sub">{t.billing_lede}</p>
      {flash && <p className="ask-banner">{flash === "canceled" ? t.billing_canceled : flash === "stub" ? t.billing_stub_entitlement : t.billing_ok}</p>}
      {err && <p className="ae-card">{t.billing_retry} <button type="button" className="ae-btn ghost" onClick={() => void load()}>{t.refresh}</button></p>}
      {actionErr && <p className="ae-card">{actionErr}</p>}
      {notConfigured && <p className="ask-banner">{t.billing_not_configured}</p>}
      {status && (
        <div className="grid-2">
          <div className="plate rec interactive">
            <p className="mono-label">{String(status.plan)}</p>
            <h2>{String(status.billing_status)} · AED</h2>
            <p>{t.projects_quota}: {used} / {quota}</p>
            <div className="quota"><span style={{ width: `${pct}%` }} /></div>
            {status.quota_hit ? <p className="ask-banner">{t.quota_full}</p> : null}
            {status.stub ? <p className="muted">{t.billing_stub_entitlement}</p> : status.stripe_live ? <p className="muted">{t.stripe_live}</p> : null}
            {owner && !notConfigured && (
              <div className="dash-actions">
                <button type="button" className="ae-btn" onClick={() => void post("/api/billing/checkout", {})}>{t.upgrade}</button>
                <button type="button" className="ae-btn ghost" onClick={() => void post("/api/billing/checkout", { addon: true })}>{t.project_pack}</button>
                <button type="button" className="ae-btn ghost" onClick={() => void post("/api/billing/portal", {})}>{t.customer_portal}</button>
              </div>
            )}
          </div>
          <div className="ae-card interactive billing-pilot">
            <p className="mono-label">{t.pilot_rec}</p>
            <h2>{t.pilot_name}</h2>
            <ul>
              <li>{t.pilot_b1}</li>
              <li>{t.pilot_b2}</li>
              <li>{t.pilot_b3}</li>
              <li>{t.whatsapp_best_effort}</li>
            </ul>
          </div>
        </div>
      )}
    </AppPage>
  );
}
