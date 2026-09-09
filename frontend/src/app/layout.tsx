"use client";

import { useEffect, useState } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState("en");
  useEffect(() => {
    const stored = localStorage.getItem("pb_locale") || "en";
    setLocale(stored);
    document.documentElement.lang = stored;
    document.documentElement.dir = stored === "ar" ? "rtl" : "ltr";
  }, []);
  function toggle() {
    const next = locale === "ar" ? "en" : "ar";
    localStorage.setItem("pb_locale", next);
    setLocale(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  }
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <header className="top">
          <strong>PULSEBUILD</strong>
          <span className="muted">Morning briefing by email</span>
          <nav>
            <a href="/">Digest</a>{" "}
            <a href="/onboarding">Start</a>{" "}
            <a href="/billing">Billing</a>{" "}
            <a href="/flags">Flags</a>{" "}
            <button type="button" onClick={toggle}>{locale === "ar" ? "EN" : "ع"}</button>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
