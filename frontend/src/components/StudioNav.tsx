"use client";

import Link from "next/link";
import ThemeLocale from "./ThemeLocale";
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
      <Link className="wordmark" href="/">PulseBuild.</Link>
      <nav>
        <Link href="/product">{t.nav_product}</Link>
        <Link href="/pricing">{t.nav_pricing}</Link>
        <Link href="/case-studies">{t.nav_cases}</Link>
        <Link href="/contact">{t.nav_contact}</Link>
      </nav>
      <div className="tools">
        {onTheme && onLocale && <ThemeLocale theme={theme || "light"} locale={locale || "en"} onTheme={onTheme} onLocale={onLocale} t={t} />}
        <Link className="ae-btn" href="/login">{t.login}</Link>
      </div>
    </header>
  );
}
