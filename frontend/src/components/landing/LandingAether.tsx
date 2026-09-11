"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import StudioFooter from "../StudioFooter";
import HeroWaves from "../HeroWaves";
import { MotionItem, MotionSection, MotionStagger } from "../motion/MotionSection";
import { easeOut } from "../../lib/motion";

const SLA_MIN = 6 * 60;

function dubaiParts() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value || 0);
  return h * 60 + m;
}

function modelFromProgress(p: number) {
  const minutes = Math.round(Math.min(1, Math.max(0, p)) * SLA_MIN);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return {
    local: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    zone: "Asia/Dubai",
    minutesToSla: Math.max(0, SLA_MIN - minutes),
    progressPct: Math.round(Math.min(1, Math.max(0, p)) * 100),
    progress: Math.min(1, Math.max(0, p)),
  };
}

const WORK = [
  {
    name: "Marina Fitout",
    type: "demo",
    status: "seed",
    noteKey: "work_marina_note" as const,
    badge: "seed",
  },
  {
    name: "Al Quoz Supply",
    type: "demo",
    status: "seed",
    noteKey: "work_quoz_note" as const,
    badge: "seed",
  },
  {
    name: "Risk digest",
    type: "product",
    status: "live",
    noteKey: "channel_promise" as const,
    badge: "live",
  },
];

export default function LandingAether() {
  const [locale, setLocale] = useState("en");
  const [scrub, setScrub] = useState(() => Math.min(1, dubaiParts() / SLA_MIN));
  const [liveClock, setLiveClock] = useState(true);
  const [cap, setCap] = useState(0);
  const [how, setHow] = useState(0);
  const [typed, setTyped] = useState("");
  const trackRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const dragging = useRef(false);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  // Longer, ease-out fade — hero lingers then softens into the next section
  const heroVisualOpacity = useTransform(scrollYProgress, [0, 0.35, 0.7, 0.92], [1, 0.92, 0.45, 0]);
  const heroVisualY = useTransform(scrollYProgress, [0, 0.92], [0, 72]);
  const heroVisualBlur = useTransform(scrollYProgress, [0, 0.5, 0.92], [0, 4, 14]);
  const heroCopyOpacity = useTransform(scrollYProgress, [0, 0.4, 0.75, 0.95], [1, 0.95, 0.4, 0]);
  const heroCopyY = useTransform(scrollYProgress, [0, 0.95], [0, 36]);
  const heroFilter = useTransform(heroVisualBlur, (b) => `blur(${b}px)`);

  useEffect(() => {
    const read = () => setLocale(localStorage.getItem("pb_locale") || "en");
    read();
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!liveClock) return;
    const tick = () => setScrub(Math.min(1, dubaiParts() / SLA_MIN));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [liveClock]);

  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const clock = modelFromProgress(scrub);

  const caps = [
    { n: "01", h: t.cap_ingest_h, p: t.ingest_line, d: t.cap_ingest_d },
    { n: "02", h: t.cap_gate_h, p: t.act_def, d: t.cap_gate_d },
    { n: "03", h: t.cap_tenant_h, p: t.tenant_line, d: t.cap_tenant_d },
    { n: "04", h: t.cap_proof_h, p: t.share_proof, d: t.cap_proof_d },
  ];

  const howSteps = [
    { n: "01", h: t.how_1, p: t.ingest_line, act: t.how_sample_act_1, watch: t.how_sample_watch_1 },
    { n: "02", h: t.how_2, p: t.act_def, act: t.how_sample_act_2, watch: t.how_sample_watch_2 },
    { n: "03", h: t.how_3, p: t.channel_promise, act: t.how_sample_act_3, watch: t.how_sample_watch_3 },
  ];

  useEffect(() => {
    const full = howSteps[how]?.act || "";
    if (reduce) {
      setTyped(full);
      return;
    }
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i >= full.length) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [how, locale, reduce]);

  const setFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const rtl = document.documentElement.dir === "rtl";
    let p = (clientX - r.left) / Math.max(1, r.width);
    if (rtl) p = 1 - p;
    setLiveClock(false);
    setScrub(Math.min(1, Math.max(0, p)));
  }, []);

  useEffect(() => {
    const onUp = () => {
      dragging.current = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      setFromClientX(e.clientX);
    };
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
    };
  }, [setFromClientX]);

  const lineH = `${((how + 1) / howSteps.length) * 100}%`;

  return (
    <div className="land">
      <section className="land-hero" ref={heroRef}>
        <motion.div
          className="land-hero-visual"
          style={
            reduce
              ? undefined
              : {
                  opacity: heroVisualOpacity,
                  y: heroVisualY,
                  filter: heroFilter,
                }
          }
          aria-hidden
        >
          <HeroWaves />
        </motion.div>
        <motion.div
          className="land-hero-copy"
          style={reduce ? undefined : { opacity: heroCopyOpacity, y: heroCopyY }}
        >
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={easeOut}
          >
            <p className="mono-label">{t.hero_eyebrow}</p>
            <h1>
              {t.hero_line_risk} <span className="pigment">{t.hero_line_margin}</span>
            </h1>
            <p className="lede">{t.hero_lede}</p>
            <div className="ae-actions" style={{ justifyContent: "flex-start" }}>
              <Link className="ae-btn" href="/login">{t.login}</Link>
              <Link className="ae-btn ghost" href="/product">{t.nav_product}</Link>
              <Link className="ae-btn ghost" href="/pricing">{t.nav_pricing}</Link>
            </div>
          </motion.div>
        </motion.div>
        <motion.p
          className="land-caption mono-label"
          style={reduce ? undefined : { opacity: heroCopyOpacity }}
        >
          {t.whatsapp_best_effort}
        </motion.p>
      </section>

      {/* 01 Briefing — copy only, no SVG box */}
      <MotionSection className="land-sec">
        <MotionItem>
          <p className="sec-mark">01 — {t.sec_briefing}</p>
        </MotionItem>
        <div className="brief-only">
          <MotionItem as="h2">
            {t.drawing_h} <span className="pigment">{t.drawing_em}</span>
          </MotionItem>
          <MotionItem as="p" className="lede">
            {t.drawing_lede}
          </MotionItem>
          <MotionStagger>
            <MotionItem>
              <div className="deflist">
                <div>
                  <span className="mono-label">{t.section_act}</span>
                  <span>{t.act_def}</span>
                  <span>{t.pointer_required}</span>
                </div>
                <div>
                  <span className="mono-label">{t.section_watch}</span>
                  <span>{t.watch_def}</span>
                  <span>{t.digest_title}</span>
                </div>
                <div>
                  <span className="mono-label">SLA</span>
                  <span>{t.sla_def}</span>
                  <span>06:00</span>
                </div>
                <div>
                  <span className="mono-label">{t.channel_label}</span>
                  <span>{t.channel_promise}</span>
                  <span>email</span>
                </div>
              </div>
            </MotionItem>
          </MotionStagger>
        </div>
      </MotionSection>

      {/* 02 Compact schedule scrubber */}
      <MotionSection className="land-sec">
        <MotionItem>
          <p className="sec-mark">02 — {t.sec_morning}</p>
        </MotionItem>
        <MotionItem as="h2">{t.study_h}</MotionItem>
        <MotionItem>
          <div className="sched">
            <div className="sched-head">
              <div>
                <p className="mono-label">{t.study_local}</p>
                <div className="sched-clock">
                  {clock.local} <span style={{ fontSize: "0.45em", opacity: 0.55 }}>{clock.zone}</span>
                </div>
              </div>
              <div className="sched-meta">
                <span>
                  {t.study_minutes}: <b>{clock.minutesToSla}</b>
                </span>
                <span>
                  {t.study_progress}: <b>{clock.progressPct}%</b>
                </span>
              </div>
            </div>
            <div
              className="sched-track"
              ref={trackRef}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={clock.progressPct}
              aria-label={t.study_progress}
              onPointerDown={(e) => {
                dragging.current = true;
                setFromClientX(e.clientX);
              }}
            >
              <span className="sched-rail" />
              <span className="sched-fill" style={{ width: `${clock.progress * 100}%` }} />
              <span className="sched-thumb" style={{ insetInlineStart: `${clock.progress * 100}%` }} />
            </div>
            <div className="sched-labels">
              <span>00:00</span>
              <span>03:00</span>
              <span>06:00 SLA</span>
            </div>
            <div className="sched-live">
              <button type="button" className={liveClock ? "on" : ""} onClick={() => setLiveClock(true)}>
                {t.sched_live}
              </button>
              <span>{t.sched_hint}</span>
            </div>
          </div>
        </MotionItem>
      </MotionSection>

      {/* 03 Capability flow */}
      <MotionSection className="land-sec">
        <MotionItem>
          <p className="sec-mark">03 — {t.sec_material}</p>
        </MotionItem>
        <MotionItem as="h2">{t.material_h}</MotionItem>
        <MotionItem as="p" className="lede">
          {t.cap_lede}
        </MotionItem>
        <MotionItem>
          <div className="cap-flow" role="tablist">
            {caps.map((c, i) => (
              <button
                key={c.n}
                type="button"
                role="tab"
                aria-selected={cap === i}
                className={`cap-step ${cap === i ? "on" : ""}`}
                onClick={() => setCap(i)}
              >
                <div className="n">{c.n}</div>
                <h3>{c.h}</h3>
                <p>{c.p}</p>
              </button>
            ))}
          </div>
          <div className="cap-detail" role="tabpanel">
            {caps[cap].d}
          </div>
        </MotionItem>
      </MotionSection>

      {/* 04 How briefing works — step line */}
      <MotionSection className="land-sec">
        <MotionItem>
          <p className="sec-mark">04 — {t.how_title}</p>
        </MotionItem>
        <MotionItem as="h2">
          {t.how_h} <span className="pigment">{t.how_em}</span>
        </MotionItem>
        <MotionItem>
          <div className="how-board">
            <div className="how-steps">
              <div className="how-line" aria-hidden>
                <i style={{ height: lineH }} />
              </div>
              {howSteps.map((s, i) => (
                <button
                  key={s.n}
                  type="button"
                  className={`how-step ${how === i ? "on" : ""}`}
                  onClick={() => setHow(i)}
                >
                  <span className="dot" aria-hidden />
                  <div className="num">{s.n}</div>
                  <h3>{s.h}</h3>
                  <p>{s.p}</p>
                </button>
              ))}
            </div>
            <div className="how-preview">
              <p className="mono-label">{t.command_title}</p>
              <p className="mono-label" style={{ color: "var(--pb-pigment)" }}>
                {t.section_act}
              </p>
              <div className="act-line">
                {typed}
                {!reduce && typed.length < (howSteps[how]?.act.length || 0) && <span className="caret" />}
              </div>
              <p className="mono-label">{t.section_watch}</p>
              <div className="watch-line">{howSteps[how]?.watch}</div>
            </div>
          </div>
        </MotionItem>
      </MotionSection>

      {/* 05 Work proof */}
      <MotionSection className="land-sec">
        <MotionItem>
          <p className="sec-mark">05 — {t.sec_work}</p>
        </MotionItem>
        <MotionItem as="h2">{t.work_h}</MotionItem>
        <MotionItem as="p" className="lede">
          {t.work_lede}
        </MotionItem>
        <MotionStagger className="work-proof">
          {WORK.map((row) => (
            <MotionItem key={row.name} className="work-row">
              <div className="proj">{row.name}</div>
              <div>
                <span className="badge">{row.type}</span>
              </div>
              <div>
                <span className={`badge ${row.badge}`}>{row.status}</span>
              </div>
              <div className="note">{t[row.noteKey] || row.noteKey}</div>
            </MotionItem>
          ))}
        </MotionStagger>
      </MotionSection>

      {/* Final CTA — not "Close" */}
      <section className="land-cta">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={easeOut}
        >
          <p className="sec-mark">{t.sec_cta}</p>
          <h2>
            {t.hero_line1} <span className="pigment">{t.hero_line2}</span>
          </h2>
          <p className="mono-label">{t.trust}</p>
          <div className="ae-actions">
            <Link className="ae-btn" href="/login">{t.login}</Link>
            <Link className="ae-btn ghost" href="/contact">{t.request_pilot}</Link>
            <Link className="ae-btn ghost" href="/pricing">{t.nav_pricing}</Link>
          </div>
          <div className="close-mark" aria-hidden>
            PulseBuild.
          </div>
        </motion.div>
        <StudioFooter locale={locale} />
      </section>
    </div>
  );
}
