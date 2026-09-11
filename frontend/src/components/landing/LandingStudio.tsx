"use client";

import { useEffect, useRef, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import StudioFooter from "../StudioFooter";

const SLA_MIN = 6 * 60;

function dubaiParts() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value || 0);
  return h * 60 + m;
}

function modelFromProgress(p: number) {
  const minutes = Math.round(p * SLA_MIN);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return {
    local: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} Asia/Dubai`,
    minutesToSla: SLA_MIN - minutes,
    progressPct: Math.round(p * 100),
    progress: p,
  };
}

export default function LandingStudio() {
  const [locale, setLocale] = useState("en");
  const [scroll, setScroll] = useState(0);
  const [studyP, setStudyP] = useState(() => Math.min(1, dubaiParts() / SLA_MIN));
  const pin = useRef<HTMLElement | null>(null);
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t = (locale === "ar" ? ar : en) as Record<string, string>;

  useEffect(() => {
    setLocale(localStorage.getItem("pb_locale") || "en");
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const vh = window.innerHeight || 1;
        setScroll(Math.min(1, window.scrollY / vh));
        const el = pin.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const span = el.offsetHeight - vh;
          const passed = Math.min(1, Math.max(0, -rect.top / Math.max(1, span)));
          setStudyP(passed);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const lift = reduce ? 0 : scroll;
  const clock = modelFromProgress(studyP);
  const markerLeft = 8 + clock.progress * 84;
  const markerTop = 78 - Math.sin(clock.progress * Math.PI) * 58;

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <p className="mono-label">{t.hero_eyebrow}</p>
          <h1>{t.hero_line_risk} <span className="pigment">{t.hero_line_margin}</span></h1>
          <p className="lede">{t.hero_lede}</p>
          <div className="hero-actions">
            <a className="sq fill" href="/login">{t.login}</a>
            <a className="sq" href="/product">{t.nav_product}</a>
          </div>
        </div>
        <p className="hero-caption mono-label">{t.whatsapp_best_effort}</p>
        <div className="split" aria-hidden>
          <div className="split-line upper" style={{ transform: `translateY(-${lift * 20}vh)` }}>Pulse</div>
          <div className="split-line lower" style={{ transform: `translateY(${lift * 20}vh)` }}>Build<span className="dot">.</span></div>
        </div>
        <img
          className="cutout"
          src="/landing/subject.svg"
          alt={t.cutout_alt}
          width={520}
          height={860}
          style={{ transform: `translateY(-${lift * 24}vh) scale(${1 + lift * 0.04})`, height: "min(72vh, 640px)", width: "auto" }}
        />
      </section>

      <section className="sec">
        <p className="sec-mark">01 — {t.sec_briefing}</p>
        <div className="sec-grid">
          <div>
            <h2>{t.drawing_h} <span className="pigment">{t.drawing_em}</span></h2>
            <p className="lede">{t.drawing_lede}</p>
            <div className="deflist">
              <div><span className="mono-label">{t.section_act}</span><span>{t.act_def}</span><span>{t.pointer_required}</span></div>
              <div><span className="mono-label">{t.section_watch}</span><span>{t.watch_def}</span><span>{t.digest_title}</span></div>
              <div><span className="mono-label">SLA</span><span>{t.sla_def}</span><span>06:00</span></div>
              <div><span className="mono-label">{t.channel_label}</span><span>{t.channel_promise}</span><span>email</span></div>
            </div>
          </div>
          <svg viewBox="0 0 320 200" width="320" height="200" aria-hidden>
            <rect x="8" y="20" width="304" height="160" fill="none" stroke="#1A1917" strokeWidth="1" />
            <line x1="8" y1="20" x2="8" y2="180" stroke="#9B3418" strokeWidth="3" />
            <text x="20" y="48" fontFamily="Azeret Mono" fontSize="10" fill="#6E6A61">ACT</text>
            <text x="20" y="78" fontFamily="Instrument Serif" fontSize="22" fill="#1A1917">Programme</text>
          </svg>
        </div>
      </section>

      <section className="study-pin" ref={pin as never}>
        <div className="study">
          <p className="sec-mark">02 — {t.sec_morning}</p>
          <h2>{t.study_h}</h2>
          <div className="arc" aria-hidden>
            <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
              <path d="M8 80 Q 50 10 92 80" fill="none" stroke="#1A1917" strokeWidth="0.6" />
            </svg>
            <span className="arc-marker" style={{ left: `${markerLeft}%`, top: `${markerTop}%` }} />
          </div>
          <div className="deflist">
            <div><span className="mono-label">{t.study_local}</span><span>{clock.local}</span><span /></div>
            <div><span className="mono-label">{t.study_minutes}</span><span>{clock.minutesToSla}</span><span /></div>
            <div><span className="mono-label">{t.study_progress}</span><span>{clock.progressPct}%</span><span>00:00 → 06:00</span></div>
          </div>
        </div>
      </section>

      <section className="sec">
        <p className="sec-mark">03 — {t.sec_material}</p>
        <h2>{t.material_h}</h2>
        <div className="deflist">
          <div><span className="mono-label">GATE</span><span>{t.act_def}</span><span /></div>
          <div><span className="mono-label">TENANT</span><span>{t.tenant_line}</span><span /></div>
          <div><span className="mono-label">INGEST</span><span>{t.ingest_line}</span><span /></div>
          <div><span className="mono-label">SHARE</span><span>{t.share_proof}</span><span /></div>
        </div>
      </section>

      <section className="sec">
        <p className="sec-mark">04 — {t.sec_work}</p>
        <table className="work-table">
          <thead><tr><th>{t.projects}</th><th>{t.work_type}</th><th>{t.work_status}</th><th>{t.work_note}</th></tr></thead>
          <tbody>
            <tr><td className="proj">Marina Fitout</td><td>demo</td><td>seed</td><td>{t.section_watch}</td></tr>
            <tr><td className="proj">{t.digest_title}</td><td>product</td><td>live</td><td>{t.channel_promise}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="sec">
        <p className="sec-mark">05 — {t.sec_close}</p>
        <h2>{t.hero_line1} <span className="pigment">{t.hero_line2}</span></h2>
        <p className="mono-label">{t.trust}</p>
        <div className="hero-actions">
          <a className="sq fill" href="/login">{t.login}</a>
          <a className="sq" href="/contact">{t.nav_contact}</a>
        </div>
        <div className="close-mark" aria-hidden>PulseBuild.</div>
        <StudioFooter />
      </section>
    </div>
  );
}
