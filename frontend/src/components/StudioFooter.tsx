"use client";

import { useEffect, useState } from "react";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

export default function StudioFooter() {
  const [locale, setLocale] = useState("en");
  useEffect(() => { setLocale(localStorage.getItem("pb_locale") || "en"); }, []);
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  return (
    <footer className="studio-footer">
      <span>{t.whatsapp_best_effort}</span>
      <span>{t.trust}</span>
    </footer>
  );
}
