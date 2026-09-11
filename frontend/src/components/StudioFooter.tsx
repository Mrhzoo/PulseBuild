"use client";

import Link from "next/link";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

export default function StudioFooter({ locale }: { locale?: string }) {
  const t = ((locale === "ar" ? ar : en) as Record<string, string>);
  return (
    <footer className="ae-footer rich">
      <div className="ft-brand">
        <Link className="wordmark" href="/">PulseBuild.</Link>
        <p>{t.footer_tag}</p>
        <p className="muted">{t.whatsapp_best_effort}</p>
      </div>
      <div className="ft-col">
        <p className="mono-label">{t.nav_product}</p>
        <Link href="/product">{t.nav_product}</Link>
        <Link href="/pricing">{t.nav_pricing}</Link>
        <Link href="/case-studies">{t.nav_cases}</Link>
      </div>
      <div className="ft-col">
        <p className="mono-label">{t.nav_contact}</p>
        <Link href="/contact">{t.request_pilot}</Link>
        <Link href="/login">{t.login}</Link>
        <a href="mailto:hello@pulsebuild.ae">hello@pulsebuild.ae</a>
      </div>
    </footer>
  );
}
