"use client";

import { useEffect, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";

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
    <article className="mkt-page">
      <p className="mono-label">{t.nav_cases}</p>
      <h1>{t.cases_h}</h1>
      <p className="lede">{t.cases_lede}</p>
      <article className="ae-card">
        <p className="mono-label">demo</p>
        <h3>Marina Fitout</h3>
        <p>{t.cases_demo}</p>
      </article>
    </article>
  );
}
