"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

export default function StudioFooter({ locale }: { locale?: string }) {
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const reduce = useReducedMotion();
  return (
    <motion.footer
      className="ae-footer rich"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
    >
      <div className="ft-brand">
        <Link className="wordmark" href="/">
          PulseBuild<span className="pigment">.</span>
        </Link>
        <p>{t.footer_tag}</p>
        <p className="muted">{t.whatsapp_best_effort}</p>
      </div>
      <div className="ft-col">
        <p className="mono-label">{t.footer_product}</p>
        <Link href="/product">{t.nav_product}</Link>
        <Link href="/pricing">{t.nav_pricing}</Link>
        <Link href="/case-studies">{t.nav_cases}</Link>
      </div>
      <div className="ft-col">
        <p className="mono-label">{t.footer_company}</p>
        <Link href="/contact">{t.request_pilot}</Link>
        <Link href="/login">{t.login}</Link>
        <Link href="/">{t.nav_home}</Link>
      </div>
      <div className="ft-col">
        <p className="mono-label">{t.footer_legal}</p>
        <a href="mailto:hello@pulsebuild.ae">hello@pulsebuild.ae</a>
        <a href="mailto:hello@pulsebuild.ae">{t.contact_mail}</a>
        <p className="ft-legal">© PulseBuild · UAE / KSA</p>
      </div>
    </motion.footer>
  );
}
