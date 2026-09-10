"use client";

import { FormEvent, useEffect, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const DEV = process.env.NEXT_PUBLIC_APP_ENV === "development" || (typeof window !== "undefined" && window.location.hostname === "localhost");
const VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4";

export default function LoginPage() {
  const [locale, setLocale] = useState("en");
  const [error, setError] = useState("");
  const [email, setEmail] = useState(DEV ? "owner@demo.pulsebuild.local" : "");
  const [password, setPassword] = useState(DEV ? "demo-owner-pass" : "");

  useEffect(() => {
    setLocale(localStorage.getItem("pb_locale") || "en");
  }, []);
  const t = locale === "ar" ? ar : en;

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
    <div className="login-stage">
      <video className="login-video" autoPlay muted loop playsInline>
        <source src={VIDEO} type="video/mp4" />
      </video>
      <div className="login-veil" />
      <form className="login-card" onSubmit={(e) => void onSubmit(e)}>
        <p className="login-kicker"><a href="/">PulseBuild</a></p>
        <h1 className="login-title">Sign in to PulseBuild</h1>
        <p className="sub">{t.whatsapp_best_effort}</p>
        <label>{t.email}</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="username" />
        <label>{t.password}</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required autoComplete="current-password" />
        <button type="submit">{t.login}</button>
        {error && <p className="ev">{error}</p>}
        <p className="muted"><a href="/">← Home</a></p>
      </form>
    </div>
  );
}
