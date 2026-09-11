"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import StudioFooter from "../StudioFooter";
import SkyMotion from "../SkyMotion";

export default function LandingAether() {
  const [locale, setLocale] = useState("en");
  useEffect(() => {
    const read = () => setLocale(localStorage.getItem("pb_locale") || "en");
    read();
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, []);
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  return (
    <div>
      <section className="ae-hero ae-reveal">
        <SkyMotion />
        <p className="mono-label">{t.hero_eyebrow}</p>
        <h1>{t.hero_line_risk} {t.hero_line_margin}</h1>
        <p className="lede">{t.hero_lede}</p>
        <div className="ae-actions">
          <Link className="ae-btn" href="/login">{t.login}</Link>
          <Link className="ae-btn ghost" href="/product">{t.nav_product}</Link>
        </div>
      </section>
      <section className="ae-section">
        <h2>{t.drawing_h} {t.drawing_em}</h2>
        <p className="ae-copy">{t.drawing_lede}</p>
        <div className="ae-grid lift">
          <article className="ae-card interactive"><p className="mono-label">{t.section_act}</p><h3>{t.act_def}</h3></article>
          <article className="ae-card interactive"><p className="mono-label">{t.section_watch}</p><h3>{t.watch_def}</h3></article>
          <article className="ae-card interactive"><p className="mono-label">{t.sla_label}</p><h3>{t.sla_def}</h3></article>
        </div>
      </section>
      <section className="ae-section">
        <h2>{t.how_title}</h2>
        <div className="ae-grid lift">
          <article className="ae-card interactive"><p className="mono-label">01</p><h3>{t.how_1}</h3><p>{t.ingest_line}</p></article>
          <article className="ae-card interactive"><p className="mono-label">02</p><h3>{t.how_2}</h3><p>{t.act_def}</p></article>
          <article className="ae-card interactive"><p className="mono-label">03</p><h3>{t.how_3}</h3><p>{t.channel_promise}</p></article>
        </div>
      </section>
      <section className="ae-section" style={{ textAlign: "center" }}>
        <h2>{t.hero_line1} {t.hero_line2}</h2>
        <p className="ae-copy" style={{ marginLeft: "auto", marginRight: "auto" }}>{t.trust}</p>
        <div className="ae-actions">
          <Link className="ae-btn" href="/contact">{t.request_pilot}</Link>
          <Link className="ae-btn ghost" href="/pricing">{t.nav_pricing}</Link>
        </div>
      </section>
      <StudioFooter locale={locale} />
    </div>
  );
}
