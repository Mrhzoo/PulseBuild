"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import MarketingFrame from "../../components/MarketingFrame";

export default function ProductPage() {
  const [locale, setLocale] = useState("en");
  const [open, setOpen] = useState("act");
  useEffect(() => {
    const read = () => setLocale(localStorage.getItem("pb_locale") || "en");
    read();
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, []);
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const items = [
    { id: "act", label: t.section_act, body: t.act_def },
    { id: "watch", label: t.section_watch, body: t.watch_def },
    { id: "sla", label: t.sla_label, body: t.sla_def },
  ];
  return (
    <MarketingFrame locale={locale} kicker={t.nav_product} title={t.product_h} lede={t.product_lede}>
      <div className="ae-grid lift">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`ae-card interactive ${open === item.id ? "on" : ""}`}
            onClick={() => setOpen(item.id)}
          >
            <p className="mono-label">{item.label}</p>
            <h3>{item.body}</h3>
          </button>
        ))}
      </div>
      <h2>{t.how_title}</h2>
      <div className="deflist">
        <div><span className="mono-label">{t.role_owner_label}</span><span>{t.role_owner}</span><span /></div>
        <div><span className="mono-label">{t.role_ops_label}</span><span>{t.role_ops}</span><span /></div>
        <div><span className="mono-label">{t.role_reader_label}</span><span>{t.role_reader}</span><span /></div>
      </div>
      <div className="ae-actions" style={{ justifyContent: "flex-start", marginTop: 24 }}>
        <Link className="ae-btn" href="/login">{t.login}</Link>
        <Link className="ae-btn ghost" href="/pricing">{t.nav_pricing}</Link>
      </div>
    </MarketingFrame>
  );
}
