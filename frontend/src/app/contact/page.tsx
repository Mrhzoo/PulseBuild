"use client";

import { FormEvent, useEffect, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import MarketingFrame from "../../components/MarketingFrame";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function ContactPage() {
  const [locale, setLocale] = useState("en");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const read = () => setLocale(localStorage.getItem("pb_locale") || "en");
    read();
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, []);
  const t = (locale === "ar" ? ar : en) as Record<string, string>;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const city = String(form.get("city") || "");
    const problem = String(form.get("message") || "");
    const res = await fetch(`${API}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        company: form.get("company"),
        message: city ? `[${city}] ${problem}` : problem,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr(t.contact_fail);
      return;
    }
    setOk(true);
  }

  return (
    <MarketingFrame locale={locale} kicker={t.nav_contact} title={t.contact_h} lede={t.contact_lede}>
      <div className="contact-grid">
        <form className="ae-card ae-field interactive" onSubmit={(e) => void submit(e)}>
          {ok ? (
            <p className="ask-banner">{t.contact_ok}</p>
          ) : (
            <>
              <label htmlFor="c-name">{t.contact_name}</label>
              <input id="c-name" name="name" required />
              <label htmlFor="c-email">{t.email}</label>
              <input id="c-email" name="email" type="email" required />
              <label htmlFor="c-co">{t.company_name}</label>
              <input id="c-co" name="company" />
              <label htmlFor="c-city">{t.contact_city}</label>
              <input id="c-city" name="city" />
              <label htmlFor="c-msg">{t.contact_problem}</label>
              <textarea id="c-msg" name="message" required rows={5} />
              <button className="ae-btn" type="submit" disabled={busy}>{busy ? t.sending : t.contact_send}</button>
              {err && <p className="ev">{err}</p>}
            </>
          )}
        </form>
        <aside className="ae-card interactive">
          <p className="mono-label">{t.contact_how}</p>
          <p>{t.contact_mail}</p>
          <a className="ae-btn ghost" href="mailto:hello@pulsebuild.ae">hello@pulsebuild.ae</a>
        </aside>
      </div>
    </MarketingFrame>
  );
}
