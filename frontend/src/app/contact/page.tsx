"use client";

import { useEffect, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import MarketingFrame from "../../components/MarketingFrame";

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
    <MarketingFrame locale={locale} kicker={t.nav_contact} title={t.contact_h} lede={t.contact_lede}>
      <div className="ae-card">
        <p>{t.contact_how}</p>
        <a className="ae-btn" href="mailto:hello@pulsebuild.ae">{t.contact_mail}</a>
      </div>
    </MarketingFrame>
  );
}
