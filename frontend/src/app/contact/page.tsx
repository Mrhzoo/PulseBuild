"use client";

import { useEffect, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";

export default function ContactPage() {
  const [locale, setLocale] = useState("en");
  useEffect(() => {
    const read = () => setLocale(localStorage.getItem("pb_locale") || "en");
    read();
    const id = window.setInterval(read, 400);
    return () => window.clearInterval(id);
  }, []);
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  return (
    <article className="mkt-page">
      <p className="mono-label">{t.nav_contact}</p>
      <h1>{t.contact_h}</h1>
      <p className="lede">{t.contact_lede}</p>
      <div className="ae-card">
        <p>{t.contact_how}</p>
        <a className="ae-btn" href="mailto:hello@pulsebuild.ae">{t.contact_mail}</a>
      </div>
    </article>
  );
}
