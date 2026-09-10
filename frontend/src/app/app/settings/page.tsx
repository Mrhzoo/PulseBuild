"use client";

import { useEffect, useState } from "react";
import en from "../../../i18n/en.json";
import ar from "../../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
type Person = { user_id: string; email: string; name: string; role: string; whatsapp_e164: string | null };

export default function SettingsPage() {
  const [locale, setLocale] = useState("en");
  const [theme, setTheme] = useState("dark");
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const role = typeof window !== "undefined" ? localStorage.getItem("pb_role") || "" : "";
  const canInvite = role === "owner" || role === "ops";
  const [people, setPeople] = useState<Person[]>([]);
  const [email, setEmail] = useState("");
  const [temp, setTemp] = useState("");
  const [wa, setWa] = useState("");

  useEffect(() => {
    setLocale(localStorage.getItem("pb_locale") || "en");
    setTheme(localStorage.getItem("pb_theme") || "dark");
    void fetch(`${API}/api/people`, { headers: { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then(setPeople);
  }, []);

  function persistTheme(next: string) {
    localStorage.setItem("pb_theme", next);
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }
  function persistLocale(next: string) {
    localStorage.setItem("pb_locale", next);
    setLocale(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  }

  async function invite() {
    const res = await fetch(`${API}/api/people/invite`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: "reader" }),
    });
    const data = await res.json();
    setTemp(data.temporary_password || "");
  }
  async function saveWa() {
    await fetch(`${API}/api/people/me/whatsapp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp_e164: wa }),
    });
  }

  return (
    <article>
      <h1>{t.settings}</h1>
      <section className="card">
        <h2>{t.prefs}</h2>
        <button type="button" onClick={() => persistTheme(theme === "dark" ? "light" : "dark")}>{theme}</button>{" "}
        <button type="button" onClick={() => persistLocale(locale === "en" ? "ar" : "en")}>{locale}</button>
      </section>
      <section className="card">
        <h2>{t.people}</h2>
        {people.map((p) => (
          <p key={p.user_id}>{p.email} · {p.role} · {p.whatsapp_e164 || "—"}</p>
        ))}
        {canInvite && (
          <>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="invite@company.ae" />
            <button type="button" onClick={() => void invite()}>{t.invite_reader}</button>
            {temp && <p className="ask-banner">{t.temp_password}: {temp}</p>}
          </>
        )}
        {role === "owner" && (
          <>
            <p className="sub">{t.whatsapp_best_effort}</p>
            <input value={wa} onChange={(e) => setWa(e.target.value)} placeholder="+9715" />
            <button type="button" onClick={() => void saveWa()}>WhatsApp</button>
          </>
        )}
      </section>
      <details className="card">
        <summary>Meta WhatsApp</summary>
        <p className="muted">Checklist only — see docs/S7-meta-whatsapp.md. Not marked connected unless the API says so.</p>
      </details>
    </article>
  );
}
