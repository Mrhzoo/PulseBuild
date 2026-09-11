"use client";

import { useEffect, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import MarketingFrame from "../../components/MarketingFrame";

export default function CasesPage() {
  const [locale, setLocale] = useState("en");
  const [step, setStep] = useState(0);
  useEffect(() => {
    const read = () => setLocale(localStorage.getItem("pb_locale") || "en");
    read();
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, []);
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const steps = [
    { k: "01", title: t.case_s1_t, body: t.case_s1 },
    { k: "02", title: t.case_s2_t, body: t.case_s2 },
    { k: "03", title: t.case_s3_t, body: t.case_s3 },
  ];
  return (
    <MarketingFrame locale={locale} kicker={t.nav_cases} title={t.cases_h} lede={t.cases_lede}>
      <div className="case-board">
        <p className="mono-label">{t.demo_label} · Marina Fitout</p>
        <div className="case-tabs">
          {steps.map((s, i) => (
            <button key={s.k} type="button" className={`ae-btn ${step === i ? "" : "ghost"}`} onClick={() => setStep(i)}>
              {s.k} {s.title}
            </button>
          ))}
        </div>
        <article className="ae-card interactive on">
          <p className="mono-label">{steps[step].k}</p>
          <h3>{steps[step].title}</h3>
          <p>{steps[step].body}</p>
        </article>
        <p className="muted">{t.cases_demo}</p>
      </div>
    </MarketingFrame>
  );
}
