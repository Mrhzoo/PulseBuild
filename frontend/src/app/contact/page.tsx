"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import MarketingFrame from "../../components/MarketingFrame";
import { fadeUp, stagger } from "../../lib/motion";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function ContactPage() {
  const [locale, setLocale] = useState("en");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const reduce = useReducedMotion();
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
      <motion.div
        className="contact-grid"
        variants={reduce ? undefined : stagger}
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true }}
      >
        <motion.form className="ae-card ae-field" onSubmit={(e) => void submit(e)} variants={reduce ? undefined : fadeUp}>
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
              <button className="ae-btn" type="submit" disabled={busy}>
                {busy ? t.sending : t.contact_send}
              </button>
              {err && <p className="ev">{err}</p>}
            </>
          )}
        </motion.form>
        <motion.aside className="ae-card" variants={reduce ? undefined : fadeUp}>
          <p className="mono-label">{t.contact_how}</p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: "12px 0" }}>{t.contact_mail}</p>
          <p className="muted" style={{ margin: "12px 0 20px", lineHeight: 1.6 }}>
            {t.pricing_lede}
          </p>
          <a className="ae-btn ghost" href="mailto:hello@pulsebuild.ae">
            hello@pulsebuild.ae
          </a>
          <p className="muted" style={{ marginTop: 24 }}>
            {t.trust}
          </p>
        </motion.aside>
      </motion.div>
    </MarketingFrame>
  );
}
