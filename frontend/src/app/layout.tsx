"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import AppShell from "../components/AppShell";
import AuthGuard from "../components/AuthGuard";
import MarketingHeader from "../components/MarketingHeader";

function applyDom(theme: string, locale: string) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

const MKT = ["/product", "/case-studies", "/contact", "/pricing"];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const landing = pathname === "/";
  const login = pathname === "/login";
  const share = pathname.startsWith("/share");
  const mktPage = MKT.includes(pathname);
  const appChrome = !landing && !login && !share && !mktPage;
  const [locale, setLocale] = useState("en");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const loc = localStorage.getItem("pb_locale") || "en";
    const th = localStorage.getItem("pb_theme") || "dark";
    setLocale(loc);
    setTheme(th);
    applyDom(th, loc);
  }, []);

  function onTheme() {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("pb_theme", next);
    setTheme(next);
    applyDom(next, locale);
  }
  function onLocale() {
    const next = locale === "ar" ? "en" : "ar";
    localStorage.setItem("pb_locale", next);
    setLocale(next);
    applyDom(theme, next);
  }

  return (
    // suppressHydrationWarning: Grammarly-style extensions inject data-gr-* on <body> before hydrate.
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-theme={theme} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {appChrome && <AppShell theme={theme} locale={locale} onTheme={onTheme} onLocale={onLocale} />}
        {mktPage && <MarketingHeader theme={theme} locale={locale} onTheme={onTheme} onLocale={onLocale} />}
        {login && (
          <div className="login-tools">
            <button type="button" onClick={onTheme}>{theme === "dark" ? "Light" : "Dark"}</button>
            <button type="button" onClick={onLocale}>{locale === "ar" ? "EN" : "ع"}</button>
          </div>
        )}
        <AuthGuard>
          <main className={landing || login ? "flush" : undefined}>{children}</main>
        </AuthGuard>
      </body>
    </html>
  );
}
