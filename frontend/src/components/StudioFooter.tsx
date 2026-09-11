"use client";

import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

export default function StudioFooter({ locale }: { locale?: string }) {
  const t = ((locale === "ar" ? ar : en) as Record<string, string>);
  return (
    <footer className="ae-footer">
      <span>{t.whatsapp_best_effort}</span>
      <span>
        <a href="/contact">{t.nav_contact}</a>
        {" · "}
        <a href="/pricing">{t.nav_pricing}</a>
        {" · "}
        <a href="/login">{t.login}</a>
      </span>
    </footer>
  );
}
