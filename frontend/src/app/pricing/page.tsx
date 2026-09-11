"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";
import MarketingFrame from "../../components/MarketingFrame";
import { fadeUp, stagger } from "../../lib/motion";

const PILOT = process.env.NEXT_PUBLIC_PRICE_PILOT || "AED 1,500/mo";
const PACK = process.env.NEXT_PUBLIC_PRICE_PACK || "AED 400/project/mo";

export default function PricingPage() {
  const [locale, setLocale] = useState("en");
  const reduce = useReducedMotion();
  useEffect(() => {
    const read = () => setLocale(localStorage.getItem("pb_locale") || "en");
    read();
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, []);
  const t = (locale === "ar" ? ar : en) as Record<string, string>;

  const rows = [
    { label: t.feat_email_sla, pilot: true, pack: true, assist: true },
    { label: t.feat_act_gate, pilot: true, pack: true, assist: true },
    { label: t.feat_watch, pilot: true, pack: true, assist: true },
    { label: t.feat_share, pilot: true, pack: true, assist: true },
    { label: t.feat_tenant, pilot: true, pack: true, assist: true },
    { label: t.feat_slots, pilot: "pilot", pack: "+", assist: "custom" },
    { label: t.feat_assist, pilot: false, pack: false, assist: true },
  ];

  return (
    <MarketingFrame locale={locale} kicker={t.nav_pricing} title={t.pricing_h} lede={t.pricing_lede}>
      <motion.div
        className="plates"
        variants={reduce ? undefined : stagger}
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        <motion.div className="plate rec interactive" variants={reduce ? undefined : fadeUp}>
          <p className="mono-label">{t.pilot_rec}</p>
          <h2>{t.pilot_name}</h2>
          <p className="price">{PILOT}</p>
          <p className="lede">{t.pilot_lede}</p>
          <ul>
            <li>{t.pilot_b1}</li>
            <li>{t.pilot_b2}</li>
            <li>{t.pilot_b3}</li>
          </ul>
          <div className="plate-cta">
            <Link className="ae-btn" href="/contact">
              {t.request_pilot}
            </Link>
            <Link className="ae-btn ghost" href="/login">
              {t.get_started}
            </Link>
          </div>
        </motion.div>
        <motion.div className="plate interactive" variants={reduce ? undefined : fadeUp}>
          <p className="mono-label">{t.pack_name}</p>
          <h2>{t.pack_name_full}</h2>
          <p className="price">{PACK}</p>
          <p className="lede">{t.pack_lede}</p>
          <ul>
            <li>{t.pack_b1}</li>
            <li>{t.pack_b2}</li>
            <li>{t.pack_b3}</li>
          </ul>
          <div className="plate-cta">
            <Link className="ae-btn ghost" href="/login">
              {t.login}
            </Link>
          </div>
        </motion.div>
        <motion.div className="plate interactive" variants={reduce ? undefined : fadeUp}>
          <p className="mono-label">{t.assisted_name}</p>
          <h2>{t.assisted_h}</h2>
          <p className="price">Custom</p>
          <p className="lede">{t.assisted_lede_short}</p>
          <ul>
            <li>{t.assisted_b1}</li>
            <li>{t.assisted_b2}</li>
          </ul>
          <div className="plate-cta">
            <Link className="ae-btn ghost" href="/contact">
              {t.nav_contact}
            </Link>
          </div>
        </motion.div>
      </motion.div>

      <h2 style={{ marginTop: 48 }}>{t.pricing_compare_h}</h2>
      <table className="compare">
        <thead>
          <tr>
            <th>{t.nav_product}</th>
            <th>{t.pilot_name}</th>
            <th>{t.pack_name_full}</th>
            <th>{t.assisted_name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td className={r.pilot === true ? "check" : ""}>
                {r.pilot === true ? "✓" : r.pilot === false ? "—" : String(r.pilot)}
              </td>
              <td className={r.pack === true ? "check" : ""}>
                {r.pack === true ? "✓" : r.pack === false ? "—" : String(r.pack)}
              </td>
              <td className={r.assist === true ? "check" : ""}>
                {r.assist === true ? "✓" : r.assist === false ? "—" : String(r.assist)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="faq">
        <p className="sec-mark" style={{ marginTop: 32 }}>
          FAQ
        </p>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <details key={n} open={n === 1}>
            <summary>{t[`pricing_faq_${n}_q`]}</summary>
            <p>{t[`pricing_faq_${n}_a`]}</p>
          </details>
        ))}
      </div>

      <div className="ae-actions" style={{ justifyContent: "flex-start", marginTop: 32 }}>
        <Link className="ae-btn" href="/contact">
          {t.request_pilot}
        </Link>
        <Link className="ae-btn ghost" href="/login">
          {t.login}
        </Link>
      </div>
    </MarketingFrame>
  );
}
