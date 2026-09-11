"use client";

import { useEffect, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import MarketingFrame from "../../components/MarketingFrame";

export default function CasesPage() {
  const [locale, setLocale] = useState("en");
  useEffect(() => {
    const read = () => setLocale(localStorage.getItem("pb_locale") || "en");
    read();
    const id = window.setInterval(read, 400);
    return () => window.clearInterval(id);
  }, []);
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  return (
    <MarketingFrame locale={locale} kicker={t.nav_cases} title={t.cases_h} lede={t.cases_lede}>
      <article className="ae-card">
        <p className="mono-label">{t.demo_label}</p>
        <h3>Marina Fitout</h3>
        <p>{t.cases_demo}</p>
      </article>
    </MarketingFrame>
  );
}
