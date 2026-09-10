"use client";

import { useEffect, useState } from "react";
import en from "../../../i18n/en.json";
import ar from "../../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
function tok() { return localStorage.getItem("pb_token") || ""; }

export default function AppOnboardingPage() {
  const [locale, setLocale] = useState("en");
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("Marina Fitout");
  const [code, setCode] = useState("MARINA");
  const [forward, setForward] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [temp, setTemp] = useState("");
  const [wa, setWa] = useState("");

  useEffect(() => {
    setLocale(localStorage.getItem("pb_locale") || "en");
    void fetch(`${API}/api/onboarding/status`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.completed) setDone(true); });
  }, []);

  async function createProject() {
    const res = await fetch(`${API}/api/projects`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name, code }),
    });
    const data = await res.json();
    setForward(data.forward_address || "");
    if (res.ok) setStep(2);
  }
  async function invite() {
    const res = await fetch(`${API}/api/people/invite`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: "reader" }),
    });
    const data = await res.json();
    setTemp(data.temporary_password || "");
    if (res.ok) setStep(3);
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
      <button type="button" onClick={() => { void navigator.clipboard.writeText(forward); setCopied(true); }}>{copied ? t.copied : t.copy_share}</button>{" "}
      <a href="/app/projects">{t.upload}</a>
    </p>
  ) : null;

  if (done) {
    return (
      <article>
        <h1>{t.onboarding}</h1>
        {forwardBanner}
        <p className="card">{t.onboarding_done} <a href="/app">{t.open_digest}</a></p>
      </article>
    );
  }

  return (
    <article>
      <h1>{t.onboarding}</h1>
      <p className="muted">{t.step_n.replace("{n}", String(step))}</p>
      {forwardBanner}
      {step === 1 && (
        <div className="card">
          <h2>{t.create_project}</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <input value={code} onChange={(e) => setCode(e.target.value)} />
          <button type="button" onClick={() => void createProject()}>{t.create_project}</button>
        </div>
      )}
      {step === 2 && (
        <div className="card">
          <h2>{t.invite_reader}</h2>
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" />
          <button type="button" onClick={() => void invite()}>{t.invite_reader}</button>
          {temp && <p className="ask-banner">{t.temp_password}: {temp}</p>}
          <p><button type="button" onClick={() => setStep(3)}>{t.skip}</button></p>
        </div>
      )}
      {step === 3 && (
        <div className="card">
          <h2>{t.save_whatsapp}</h2>
          <p className="sub">{t.whatsapp_best_effort}</p>
          <input value={wa} onChange={(e) => setWa(e.target.value)} />
          <button type="button" onClick={() => void saveWa()}>{t.save_continue}</button>
        </div>
      )}
      {step === 4 && (
        <div className="card">
          <h2>{t.onboarding_done}</h2>
          <button type="button" onClick={() => void complete()}>{t.finish}</button>
        </div>
      )}
    </article>
  );
}
