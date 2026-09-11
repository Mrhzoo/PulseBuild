"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import MarketingFrame from "../../components/MarketingFrame";
import { fadeUp, stagger } from "../../lib/motion";

export default function CasesPage() {
  const [locale, setLocale] = useState("en");
  const reduce = useReducedMotion();
  useEffect(() => {
    const read = () => setLocale(localStorage.getItem("pb_locale") || "en");
    read();
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, []);
  const t = (locale === "ar" ? ar : en) as Record<string, string>;

  const blocks = [
    { phase: "01", title: t.case_problem_t, body: t.case_marina_problem },
    { phase: "02", title: t.case_briefing_t, body: t.case_marina_briefing },
    { phase: "03", title: t.case_outcome_t, body: t.case_marina_outcome },
  ];

  const secondary = [
    { name: "Al Quoz Supply", note: t.work_quoz_note, status: "seed" },
    { name: t.digest_title, note: t.channel_promise, status: "live" },
  ];

  return (
    <MarketingFrame locale={locale} kicker={t.nav_cases} title={t.cases_h} lede={t.cases_lede}>
      <div className="case-hero-meta">
        <span className="badge seed" style={{ border: "1px solid var(--border)", padding: "4px 10px", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {t.demo_label}
        </span>
        <h2 style={{ margin: 0, fontSize: 36 }}>Marina Fitout</h2>
        <span className="muted">{t.cases_demo}</span>
      </div>

      <motion.div
        className="case-editorial"
        variants={reduce ? undefined : stagger}
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.12 }}
      >
        {blocks.map((b) => (
          <motion.article key={b.phase} className="case-block" variants={reduce ? undefined : fadeUp}>
            <div>
              <p className="phase">
                {b.phase} — {b.title}
              </p>
            </div>
            <div>
              <h3>{b.title}</h3>
              <p>{b.body}</p>
            </div>
          </motion.article>
        ))}
      </motion.div>

      <h2 style={{ marginTop: 48 }}>{t.sec_work}</h2>
      <div className="work-proof">
        {secondary.map((row) => (
          <div key={row.name} className="work-row">
            <div className="proj">{row.name}</div>
            <div>
              <span className="badge">{t.demo_label}</span>
            </div>
            <div>
              <span className={`badge ${row.status}`}>{row.status}</span>
            </div>
            <div className="note">{row.note}</div>
          </div>
        ))}
      </div>

      <div className="ae-actions" style={{ marginTop: 32 }}>
        <Link className="ae-btn" href="/contact">
          {t.request_pilot}
        </Link>
        <Link className="ae-btn ghost" href="/product">
          {t.nav_product}
        </Link>
      </div>
    </MarketingFrame>
  );
}
