"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import { easeOut } from "../../lib/motion";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}
const DEV = process.env.NEXT_PUBLIC_APP_ENV === "development" || (typeof window !== "undefined" && isLocalHost());

export default function LoginPage() {
  const [locale, setLocale] = useState("en");
  const [error, setError] = useState("");
  const [email, setEmail] = useState(DEV ? "owner@demo.pulsebuild.local" : "");
  const [password, setPassword] = useState(DEV ? "demo-owner-pass" : "");
  const reduce = useReducedMotion();

  useEffect(() => {
    const read = () => setLocale(localStorage.getItem("pb_locale") || "en");
    read();
    const id = window.setInterval(read, 400);
    return () => window.clearInterval(id);
  }, []);
  const t = (locale === "ar" ? ar : en) as Record<string, string>;

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
    const next = new URLSearchParams(window.location.search).get("next") || "/app";
    window.location.href = next.startsWith("/") ? next : "/app";
  }

  return (
    <div className="login-stage">
      <motion.form
        className="login-card ae-field"
        onSubmit={(e) => void onSubmit(e)}
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeOut}
      >
        <p className="login-kicker">
          <a href="/">
            PulseBuild<span className="pigment">.</span>
          </a>
        </p>
        <h1 className="login-title">{t.login_title}</h1>
        <p className="sub">{t.hero_sub}</p>
        <label htmlFor="login-email">{t.email}</label>
        <input
          id="login-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          autoComplete="username"
        />
        <label htmlFor="login-pass">{t.password}</label>
        <input
          id="login-pass"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          autoComplete="current-password"
        />
        <button className="ae-btn" type="submit" style={{ width: "100%" }}>
          {t.login}
        </button>
        {error && <p className="ev">{error}</p>}
        <p className="muted" style={{ marginTop: 16 }}>
          <a href="/contact">{t.request_pilot}</a> · <a href="/pricing">{t.nav_pricing}</a> · <a href="/">{t.nav_home}</a>
        </p>
      </motion.form>
    </div>
  );
}
