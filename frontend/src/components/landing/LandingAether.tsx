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
    <div className="ae-root">
      <section className="ae-hero">
        <h1>{t.hero_line_risk} {t.hero_line_margin}</h1>
        <p className="lede">{t.hero_lede}</p>
        <div className="ae-actions">
          <a className="ae-btn" href="/login">{t.login}</a>
          <a className="ae-btn" href="/product">{t.nav_product}</a>
        </div>
        <div className="ae-mock" aria-label={t.cutout_alt}>
          <h2>{t.command_title}</h2>
          <p>{t.channel_promise}</p>
          <div className="ae-tiles">
            <div className="ae-tile">
              <div className="k">{t.exposure_open_act}</div>
              <div className="v">2</div>
            </div>
            <div className="ae-tile ae-sun" aria-hidden />
            <div className="ae-tile">
              <div className="k">{t.exposure_days}</div>
              <div className="v">5</div>
            </div>
            <div className="ae-tile ae-forecast">
              <div className="ae-sun" style={{ height: 72, borderRadius: 8 }} />
              <div>
                <span className="pill">Watch</span>
                <div>{t.section_watch}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
