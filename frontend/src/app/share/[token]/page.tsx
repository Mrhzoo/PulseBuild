"use client";

import { useEffect, useState } from "react";
import en from "../../../i18n/en.json";
import ar from "../../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Share = {
  title: string;
  why_it_hits_us: string;
  evidence_snippet: string;
  evidence_pointer: string;
  confidence: number;
  project_name: string;
  flagged_at: string | null;
  note: string;
  company: string;
  severity: string;
};

export default function SharePage({ params }: { params: { token: string } }) {
  const [locale, setLocale] = useState("en");
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const [card, setCard] = useState<Share | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setLocale(localStorage.getItem("pb_locale") || "en");
    void fetch(`${API}/api/share/${params.token}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setCard)
      .catch(() => setMissing(true));
  }, [params.token]);

  if (missing || (!card && locale)) {
    if (missing) {
      return (
        <article className="mkt-page" style={{ margin: "12vh auto", padding: "0 24px" }}>
          <span className="logo-circle">PB</span>
          <h1>{t.share_unavailable}</h1>
          <p className="sub">{t.share_revoked}</p>
          <p className="muted">{t.share_proof}</p>
        </article>
      );
    }
  }

  if (!card) return <p className="muted">…</p>;

  return (
    <article className="mkt-page" style={{ margin: "12vh auto", padding: "0 24px" }}>
      <span className="logo-circle">PB</span>
      <p className="muted">{card.company}</p>
      <h1>{card.title}</h1>
      <div className={`dash-card ${card.severity === "act" ? "act" : "watch"}`}>
        <div className="dash-meta">
          <span className="sev-pill">{card.severity}</span>
          <span>{card.project_name}</span>
          <span className="conf-pill">{Math.round(card.confidence * 100)}%</span>
        </div>
        <p className="why">{card.why_it_hits_us}</p>
        <p className="ev">{card.evidence_snippet} · {card.evidence_pointer}</p>
        {card.note && <p>{card.note}</p>}
      </div>
      <p className="muted">{t.share_proof}</p>
    </article>
  );
}
