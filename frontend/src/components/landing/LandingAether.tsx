"use client";

import { useEffect, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";

export default function LandingAether() {
  const [locale, setLocale] = useState("en");
  useEffect(() => {
    const read = () => setLocale(localStorage.getItem("pb_locale") || "en");
    read();
    const id = window.setInterval(read, 400);
    return () => window.clearInterval(id);
  }, []);
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  return (
    <div>
      <section className="ae-hero ae-reveal">
        <p className="mono-label">{t.hero_eyebrow}</p>
        <h1>{t.hero_line_risk} {t.hero_line_margin}</h1>
        <p className="lede">{t.hero_lede}</p>
        <div className="ae-actions">
          <a className="ae-btn" href="/login">{t.login}</a>
          <a className="ae-btn ghost" href="/product">{t.nav_product}</a>
        </div>
        <div className="ae-mock">
          <h2>{t.command_title}</h2>
          <p className="subline">{t.channel_promise}</p>
          <div className="ae-tiles">
            <div className="ae-tile"><div className="k">{t.exposure_open_act}</div><div className="v">2</div></div>
            <div className="ae-tile ae-sun" aria-hidden />
            <div className="ae-tile"><div className="k">{t.exposure_days}</div><div className="v">5</div></div>
            <div className="ae-tile">
              <div className="k">{t.section_watch}</div>
              <div className="v" style={{ fontSize: 22 }}>{t.watch_def}</div>
            </div>
          </div>
        </div>
      </section>
      <section className="ae-section">
        <h2>{t.drawing_h} {t.drawing_em}</h2>
        <p className="ae-copy">{t.drawing_lede}</p>
        <div className="ae-grid">
          <article className="ae-card"><p className="mono-label">{t.section_act}</p><h3>{t.act_def}</h3></article>
          <article className="ae-card"><p className="mono-label">{t.section_watch}</p><h3>{t.watch_def}</h3></article>
          <article className="ae-card"><p className="mono-label">SLA</p><h3>{t.sla_def}</h3></article>
        </div>
      </section>
      <section className="ae-section">
        <h2>{t.how_title}</h2>
        <div className="ae-grid">
          <article className="ae-card"><p className="mono-label">01</p><h3>{t.how_1}</h3><p>{t.ingest_line}</p></article>
          <article className="ae-card"><p className="mono-label">02</p><h3>{t.how_2}</h3><p>{t.act_def}</p></article>
          <article className="ae-card"><p className="mono-label">03</p><h3>{t.how_3}</h3><p>{t.channel_promise}</p></article>
        </div>
      </section>
      <section className="ae-section" style={{ textAlign: "center" }}>
        <h2>{t.hero_line1} {t.hero_line2}</h2>
        <p className="ae-copy">{t.trust}</p>
        <div className="ae-actions">
          <a className="ae-btn" href="/contact">{t.request_pilot}</a>
          <a className="ae-btn ghost" href="/pricing">{t.nav_pricing}</a>
        </div>
      </section>
      <footer className="ae-footer">
        <span>{t.whatsapp_best_effort}</span>
        <span><a href="/contact">{t.nav_contact}</a> · <a href="/pricing">{t.nav_pricing}</a></span>
      </footer>
    </div>
  );
}
