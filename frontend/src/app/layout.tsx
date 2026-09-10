"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";

function applyDom(theme: string, locale: string) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const marketing = pathname === "/";
  const [locale, setLocale] = useState("en");
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const loc = localStorage.getItem("pb_locale") || "en";
    const th = localStorage.getItem("pb_theme") || "dark";
    setLocale(loc);
    setTheme(th);
    applyDom(th, loc);
  }, []);
  function toggleLocale() {
    const next = locale === "ar" ? "en" : "ar";
    localStorage.setItem("pb_locale", next);
    setLocale(next);
    applyDom(theme, next);
  }
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("pb_theme", next);
    setTheme(next);
    applyDom(next, locale);
  }
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-theme={theme}>
      <body>
        {!marketing && (
          <header className="top">
            <strong>PULSEBUILD</strong>
            <span className="muted">Morning briefing by email</span>
            <nav>
              <a href="/">Home</a>{" "}
              <a href="/app">Digest</a>{" "}
              <a href="/onboarding">Start</a>{" "}
              <a href="/billing">Billing</a>{" "}
              <a href="/flags">Flags</a>{" "}
              <a href="/login">Sign in</a>{" "}
              <button type="button" onClick={toggleTheme}>{theme === "dark" ? "Light" : "Dark"}</button>{" "}
              <button type="button" onClick={toggleLocale}>{locale === "ar" ? "EN" : "ع"}</button>
            </nav>
          </header>
        )}
        <main style={marketing ? { margin: 0, padding: 0, maxWidth: "none" } : undefined}>{children}</main>
      </body>
    </html>
  );
}
