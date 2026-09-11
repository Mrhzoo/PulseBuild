"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import MarketingFrame from "../../components/MarketingFrame";
import { easeOut } from "../../lib/motion";

export default function ProductPage() {
  const [locale, setLocale] = useState("en");
  const [tab, setTab] = useState("act");
  const [how, setHow] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    const read = () => setLocale(localStorage.getItem("pb_locale") || "en");
    read();
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, []);
  const t = (locale === "ar" ? ar : en) as Record<string, string>;

  const panels: Record<string, { title: string; body: string; mockTitle: string; mockEv: string; kind: string }> = {
    act: {
      title: t.section_act,
      body: t.act_def,
      mockTitle: t.how_sample_act_2,
      mockEv: "IPC §4.2 · pointer required",
      kind: "act",
    },
    watch: {
      title: t.section_watch,
      body: t.watch_def,
      mockTitle: t.how_sample_watch_2,
      mockEv: "Programme movement · no Act yet",
      kind: "watch",
    },
    sla: {
      title: t.sla_label,
      body: t.sla_def,
      mockTitle: t.how_sample_act_3,
      mockEv: t.channel_promise,
      kind: "act",
    },
  };

  const howSteps = [
    { n: "01", h: t.how_1, p: t.ingest_line },
    { n: "02", h: t.how_2, p: t.act_def },
    { n: "03", h: t.how_3, p: t.channel_promise },
  ];
  const active = panels[tab];

  return (
    <MarketingFrame locale={locale} kicker={t.nav_product} title={t.product_h} lede={t.product_lede}>
      <p className="sec-mark">{t.product_canvas_h}</p>
      <div className="prod-canvas">
        <div className="prod-tabs" role="tablist">
          {(["act", "watch", "sla"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? "on" : ""}
              onClick={() => setTab(id)}
            >
              {panels[id].title}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="prod-panel"
            role="tabpanel"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
          >
            <h3>{active.title}</h3>
            <p>{active.body}</p>
            <div className={`prod-mock-card ${active.kind}`}>
              <p className="mono-label">{active.title}</p>
              <div className="t">{active.mockTitle}</div>
              <div className="e">{active.mockEv}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <h2 style={{ marginTop: 48 }}>{t.how_title}</h2>
      <div className="how-board" style={{ marginTop: 20 }}>
        <div className="how-steps">
          <div className="how-line" aria-hidden>
            <i style={{ height: `${((how + 1) / howSteps.length) * 100}%` }} />
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
          <div className="act-line">{howSteps[how].h}</div>
          <div className="watch-line">{howSteps[how].p}</div>
        </div>
      </div>

      <h2 style={{ marginTop: 48 }}>{t.product_roles_h}</h2>
      <div className="deflist">
        <div>
          <span className="mono-label">{t.role_owner_label}</span>
          <span>{t.role_owner}</span>
          <span />
        </div>
        <div>
          <span className="mono-label">{t.role_ops_label}</span>
          <span>{t.role_ops}</span>
          <span />
        </div>
        <div>
          <span className="mono-label">{t.role_reader_label}</span>
          <span>{t.role_reader}</span>
          <span />
        </div>
      </div>

      <motion.div
        className="ae-actions"
        style={{ justifyContent: "flex-start", marginTop: 32 }}
        initial={reduce ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={easeOut}
      >
        <Link className="ae-btn" href="/login">
          {t.login}
        </Link>
        <Link className="ae-btn ghost" href="/pricing">
          {t.nav_pricing}
        </Link>
        <Link className="ae-btn ghost" href="/contact">
          {t.request_pilot}
        </Link>
      </motion.div>
    </MarketingFrame>
  );
}
