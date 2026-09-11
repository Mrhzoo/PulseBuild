"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import en from "../../../i18n/en.json";
import ar from "../../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
function tok() { return localStorage.getItem("pb_token") || ""; }

export default function AppOnboardingPage() {
  const [locale, setLocale] = useState("en");
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [forward, setForward] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [temp, setTemp] = useState("");
  const [wa, setWa] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLocale(localStorage.getItem("pb_locale") || "en");
    void fetch(`${API}/api/onboarding/status`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.completed) setDone(true); });
  }, []);

  async function createProject() {
    setErr("");
    if (!name.trim() || !code.trim()) {
      setErr(t.onboard_need_fields);
      return;
    }
    setBusy(true);
    const res = await fetch(`${API}/api/projects`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), code: code.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.status === 402) {
      setErr(t.quota_full);
      return;
    }
    if (!res.ok) {
      setErr(t.onboard_fail);
      return;
    }
    setForward(data.forward_address || "");
    setStep(2);
  }
  async function invite() {
    setErr("");
    if (!inviteEmail.trim()) {
      setStep(3);
      return;
    }
    setBusy(true);
    const res = await fetch(`${API}/api/people/invite`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: "reader" }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(t.onboard_fail);
      return;
    }
    setTemp(data.temporary_password || "");
    setStep(3);
  }
  async function saveWa() {
    if (wa) {
      await fetch(`${API}/api/people/me/whatsapp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tok()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp_e164: wa }),
      });
    }
    setStep(4);
  }
  async function complete() {
    await fetch(`${API}/api/onboarding/complete`, { method: "POST", headers: { Authorization: `Bearer ${tok()}` } });
    setDone(true);
  }

  const forwardBanner = forward ? (
    <p className="ask-banner">
      {t.forward_tip} <strong>{forward}</strong>{" "}
      <button type="button" className="ae-btn ghost" onClick={() => { void navigator.clipboard.writeText(forward); setCopied(true); }}>{copied ? t.copied : t.copy_share}</button>
    </p>
  ) : null;

  return (
    <article className="ae-page">
      <h1>{t.onboarding}</h1>
      <p className="sub">{t.onboard_lede}</p>
      {done && (
        <div className="ae-card interactive on">
          <h2>{t.onboarding_done}</h2>
          <p className="muted">{t.onboard_again}</p>
          <div className="dash-actions">
            <Link className="ae-btn" href="/app">{t.open_digest}</Link>
            <Link className="ae-btn ghost" href="/app/projects">{t.upload}</Link>
            <button type="button" className="ae-btn ghost" onClick={() => { setDone(false); setStep(1); }}>{t.create_project}</button>
          </div>
        </div>
      )}
      {!done && (
        <>
          <p className="muted">{t.step_n.replace("{n}", String(step))}</p>
          <div className="ae-stat-row onboard-steps">
            {[1, 2, 3, 4].map((n) => (
              <button key={n} type="button" className={n === step ? "ae-tile ae-sun" : "ae-tile"} onClick={() => setStep(n)}>
                <div className="k">{n}</div>
              </button>
            ))}
          </div>
          {forwardBanner}
          {err && <p className="ask-banner">{err} {err === t.quota_full && <Link href="/app/billing">{t.billing}</Link>}</p>}
          {step === 1 && (
            <div className="ae-card ae-field interactive">
              <h2>{t.create_project}</h2>
              <label htmlFor="ob-name">{t.company_name}</label>
              <input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Marina Fitout" />
              <label htmlFor="ob-code">{t.project_code}</label>
              <input id="ob-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="MARINA" />
              <button type="button" className="ae-btn" disabled={busy} onClick={() => void createProject()}>{busy ? t.sending : t.create_project}</button>
            </div>
          )}
          {step === 2 && (
            <div className="ae-card ae-field interactive">
              <h2>{t.invite_reader}</h2>
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" placeholder="reader@company.ae" />
              <button type="button" className="ae-btn" disabled={busy} onClick={() => void invite()}>{t.invite_reader}</button>
              {temp && <p className="ask-banner">{t.temp_password}: {temp}</p>}
              <p><button type="button" className="ae-btn ghost" onClick={() => setStep(3)}>{t.skip}</button></p>
            </div>
          )}
          {step === 3 && (
            <div className="ae-card ae-field interactive">
              <h2>{t.save_whatsapp}</h2>
              <p className="sub">{t.whatsapp_best_effort}</p>
              <input value={wa} onChange={(e) => setWa(e.target.value)} placeholder="+9715…" />
              <button type="button" className="ae-btn" onClick={() => void saveWa()}>{t.save_continue}</button>
            </div>
          )}
          {step === 4 && (
            <div className="ae-card interactive">
              <h2>{t.onboarding_done}</h2>
              <div className="dash-actions">
                <button type="button" className="ae-btn" onClick={() => void complete()}>{t.finish}</button>
                <Link className="ae-btn ghost" href="/app/projects">{t.upload}</Link>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}
