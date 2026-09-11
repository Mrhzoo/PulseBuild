"use client";

import { useEffect, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";

export default function ProductPage() {
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
      <p className="mono-label">{t.nav_product}</p>
      <h1>{t.product_h}</h1>
      <p className="lede">{t.product_lede}</p>
      <div className="ae-grid">
        <article className="ae-card"><p className="mono-label">{t.section_act}</p><h3>{t.act_def}</h3></article>
        <article className="ae-card"><p className="mono-label">{t.section_watch}</p><h3>{t.watch_def}</h3></article>
        <article className="ae-card"><p className="mono-label">SLA</p><h3>{t.sla_def}</h3></article>
      </div>
      <h2>{t.how_title}</h2>
      <div className="deflist">
        <div><span className="mono-label">OWNER</span><span>{t.role_owner}</span><span /></div>
        <div><span className="mono-label">OPS</span><span>{t.role_ops}</span><span /></div>
        <div><span className="mono-label">READER</span><span>{t.role_reader}</span><span /></div>
      </div>
      <div className="ae-actions" style={{ justifyContent: "flex-start", marginTop: 24 }}>
        <a className="ae-btn" href="/login">{t.login}</a>
        <a className="ae-btn ghost" href="/pricing">{t.nav_pricing}</a>
      </div>
    </article>
  );
}
