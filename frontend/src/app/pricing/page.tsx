"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import MarketingFrame from "../../components/MarketingFrame";

const PILOT = process.env.NEXT_PUBLIC_PRICE_PILOT || "AED 1,500/mo";
const PACK = process.env.NEXT_PUBLIC_PRICE_PACK || "AED 400/project/mo";

export default function PricingPage() {
  const [locale, setLocale] = useState("en");
  useEffect(() => {
    const read = () => setLocale(localStorage.getItem("pb_locale") || "en");
    read();
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, []);
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  return (
    <MarketingFrame locale={locale} kicker={t.nav_pricing} title={t.pricing_h} lede={t.pricing_lede}>
      <div className="plates lift">
        <div className="plate rec interactive">
          <p className="mono-label">{t.pilot_rec}</p>
          <h2>{t.pilot_name}</h2>
          <p className="lede">{t.pilot_lede}</p>
          <p className="price">{PILOT}</p>
          <ul>
            <li>{t.channel_promise}</li>
            <li>{t.act_def}</li>
            <li>{t.ingest_line}</li>
            <li>{t.share_proof}</li>
          </ul>
          <Link className="ae-btn" href="/contact">{t.request_pilot}</Link>
        </div>
        <div className="plate interactive">
          <p className="mono-label">{t.pack_name}</p>
          <h2>{t.project_pack}</h2>
          <p className="lede">{t.pack_lede}</p>
          <p className="price">{PACK}</p>
          <ul>
            <li>{t.pack_lede}</li>
            <li>{t.tenant_line}</li>
          </ul>
          <Link className="ae-btn ghost" href="/login">{t.login}</Link>
        </div>
      </div>
      <section className="assisted interactive">
        <p className="mono-label">{t.assisted_name}</p>
        <h2>{t.assisted_h}</h2>
        <p className="lede">{t.assisted_lede}</p>
        <Link className="ae-btn ghost" href="/contact">{t.nav_contact}</Link>
      </section>
    </MarketingFrame>
  );
}
