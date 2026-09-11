"use client";

import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

export default function StudioNav({
  locale,
  theme,
  onLocale,
  onTheme,
}: {
  locale?: string;
  theme?: string;
  onLocale?: () => void;
  onTheme?: () => void;
}) {
  const t = ((locale === "ar" ? ar : en) as Record<string, string>);
  return (
    <header className="ae-nav">
      <a className="wordmark" href="/">PulseBuild.</a>
      <nav>
        <a href="/product">{t.nav_product}</a>
        <a href="/pricing">{t.nav_pricing}</a>
        <a href="/case-studies">{t.nav_cases}</a>
        <a href="/contact">{t.nav_contact}</a>
      </nav>
      <div className="tools">
        {onTheme && <button type="button" className="ae-btn ghost" onClick={onTheme}>{theme === "dark" ? t.theme_light : t.theme_dark}</button>}
        {onLocale && <button type="button" className="ae-btn ghost" onClick={onLocale}>{locale === "ar" ? "EN" : "ع"}</button>}
        <a className="ae-btn" href="/login">{t.login}</a>
      </div>
    </header>
  );
}
