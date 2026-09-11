"use client";

import { useEffect, useState } from "react";
import en from "../../../i18n/en.json";
import ar from "../../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function SharePage({ params }: { params: { token: string } }) {
  const [locale, setLocale] = useState("en");
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setLocale(localStorage.getItem("pb_locale") || "en");
    void fetch(`${API}/api/share/${params.token}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setMissing(true));
  }, [params.token]);

  if (missing) {
    return (
      <article className="ae-mkt">
        <div className="ae-mkt-hero">
          <h1>{t.share_unavailable}</h1>
          <p className="lede">{t.share_revoked}</p>
          <p className="muted">{t.share_proof}</p>
        </div>
      </article>
    );
  }
  if (!data) return <p className="ae-page muted">{t.share_loading}</p>;

  if (data.pack) {
    const cards = data.cards || [];
    return (
      <article className="ae-mkt">
        <div className="ae-mkt-hero">
          <p className="muted">{data.company}</p>
          <h1>{t.pack_label}</h1>
          <p className="ask-banner">{data.watermark || t.pack_watermark}</p>
        </div>
        <div className="ae-section">
          {cards.length === 0 && <p className="ae-empty">{t.flags_empty}</p>}
          {cards.map((card: Record<string, any>, i: number) => (
            <div key={i} className={`ae-card dash-card ${card.severity === "act" ? "act" : "watch"}`}>
              <div className="dash-meta">
                <span className="sev-pill">{card.severity}</span>
                <span>{card.project_name}</span>
              </div>
              <h3>{card.title}</h3>
              <p className="why">{card.why_it_hits_us}</p>
              <p className="ev">{card.evidence_snippet} · {card.evidence_pointer}</p>
            </div>
          ))}
          <p className="muted">{t.share_proof}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="ae-mkt">
      <div className="ae-mkt-hero">
        <p className="muted">{data.company}</p>
        <h1>{data.title}</h1>
      </div>
      <div className="ae-section">
        <div className={`ae-card dash-card ${data.severity === "act" ? "act" : "watch"}`}>
          <div className="dash-meta">
            <span className="sev-pill">{data.severity}</span>
            <span>{data.project_name}</span>
            <span className="conf-pill">{Math.round((data.confidence || 0) * 100)}%</span>
          </div>
          <p className="why">{data.why_it_hits_us}</p>
          <p className="ev">{data.evidence_snippet} · {data.evidence_pointer}</p>
          {data.note && <p>{data.note}</p>}
        </div>
        <p className="muted">{t.share_proof}</p>
      </div>
    </article>
  );
}
