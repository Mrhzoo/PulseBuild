"use client";

import { useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function OnboardingPage() {
  const locale = typeof window !== "undefined" ? localStorage.getItem("pb_locale") || "en" : "en";
  const t = locale === "ar" ? ar : en;
  const [name, setName] = useState("Marina Fitout");
  const [code, setCode] = useState("MARINA");
  const [forward, setForward] = useState("");
  const token = () => localStorage.getItem("pb_token") || "";
  async function createProject() {
    const res = await fetch(`${API}/api/projects`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name, code }),
    });
    const data = await res.json();
    setForward(data.forward_address || "");
  }
  async function complete() {
    await fetch(`${API}/api/onboarding/complete`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
  }
  return (
    <>
      <h1>{t.onboarding}</h1>
      <div className="card">
        <p>1. {t.create_project}</p>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <input value={code} onChange={(e) => setCode(e.target.value)} />
        <button type="button" onClick={() => void createProject()}>{t.create_project}</button>
        {forward && <p className="ev">{t.forward_tip} {forward}</p>}
      </div>
      <div className="card">
        <p>2. {t.invite_reader}</p>
        <p>3. <a href="/billing">{t.billing}</a></p>
        <button type="button" onClick={() => void complete()}>Done</button>
      </div>
    </>
  );
}
