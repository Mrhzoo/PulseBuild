"use client";

import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

export default function MarketingHeader({
  theme,
  locale,
  onTheme,
  onLocale,
}: {
  theme: string;
  locale: string;
  onTheme: () => void;
  onLocale: () => void;
}) {
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  return (
    <header className="mkt-bar">
      <a className="shell-logo" href="/"><span className="logo-circle">PB</span><strong>PulseBuild</strong></a>
      <nav className="mkt-nav">
        <a href="/">{t.nav_home}</a>
        <a href="/product">{t.nav_product}</a>
        <a href="/case-studies">{t.nav_cases}</a>
        <a href="/pricing">{t.nav_pricing}</a>
        <a href="/contact">{t.nav_contact}</a>
      </nav>
      <div className="shell-actions">
        <button type="button" onClick={onTheme}>{theme === "dark" ? t.theme_light : t.theme_dark}</button>
        <button type="button" onClick={onLocale}>{locale === "ar" ? "EN" : "ع"}</button>
        <a href="/login">{t.login}</a>
      </div>
    </header>
  );
}
