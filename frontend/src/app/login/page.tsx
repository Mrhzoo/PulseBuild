"use client";

import { FormEvent, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function LoginPage() {
  const locale = typeof window !== "undefined" ? localStorage.getItem("pb_locale") || "en" : "en";
  const t = locale === "ar" ? ar : en;
  const [email, setEmail] = useState("owner@demo.pulsebuild.local");
  const [password, setPassword] = useState("demo-owner-pass");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setError(t.login_failed);
      return;
    }
    const data = await res.json();
    localStorage.setItem("pb_token", data.access_token);
    localStorage.setItem("pb_role", data.role);
    window.location.href = "/app";
  }

  return (
    <>
      <h1>{t.login}</h1>
      <p className="sub">{t.whatsapp_best_effort}</p>
      <form className="card" onSubmit={(e) => void onSubmit(e)}>
        <label>{t.email}</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label>{t.password}</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        <button type="submit">{t.login}</button>
        {error && <p className="ev">{error}</p>}
      </form>
    </>
  );
}
