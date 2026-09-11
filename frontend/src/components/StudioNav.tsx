"use client";

import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

export default function StudioNav({ locale, onLocale }: { locale?: string; onLocale?: () => void }) {
  const t = ((locale === "ar" ? ar : en) as Record<string, string>);
  return (
    <header className="studio-nav">
      <a className="wordmark" href="/">PulseBuild<span className="dot">.</span></a>
      <nav>
        <a href="/product">{t.nav_product}</a>
        <a href="/pricing">{t.nav_pricing}</a>
        <a href="/case-studies">{t.nav_cases}</a>
        <a href="/contact">{t.nav_contact}</a>
      </nav>
      <div className="nav-end">
        {onLocale && (
          <button type="button" className="sq" onClick={onLocale}>{locale === "ar" ? "EN" : "ع"}</button>
        )}
        <a className="sq" href="/product">{t.see_product}</a>
        <a className="sq fill" href="/login">{t.login}</a>
      </div>
    </header>
  );
}
