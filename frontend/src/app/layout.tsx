"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import AppShell from "../components/AppShell";
import AuthGuard from "../components/AuthGuard";
import StudioNav from "../components/StudioNav";

function applyDom(theme: string, locale: string, marketing: boolean) {
  document.documentElement.dataset.theme = marketing ? "studio" : theme;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

const MKT = ["/", "/product", "/case-studies", "/contact", "/pricing"];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const landing = pathname === "/";
  const login = pathname === "/login";
  const share = pathname.startsWith("/share");
  const mktPage = MKT.includes(pathname);
  const appChrome = !landing && !login && !share && !mktPage;
  const [locale, setLocale] = useState("en");
  const [theme, setTheme] = useState("studio");

  useEffect(() => {
    const loc = localStorage.getItem("pb_locale") || "en";
    const stored = localStorage.getItem("pb_theme") || "studio";
    const th = stored === "dark" ? "dark" : "studio";
    setLocale(loc);
    setTheme(th);
    applyDom(th, loc, mktPage || login || share);
  }, [mktPage, login, share]);

  function onTheme() {
    const next = theme === "dark" ? "studio" : "dark";
    localStorage.setItem("pb_theme", next);
    setTheme(next);
    applyDom(next, locale, false);
  }
  function onLocale() {
    const next = locale === "ar" ? "en" : "ar";
    localStorage.setItem("pb_locale", next);
    setLocale(next);
    applyDom(theme, next, mktPage || login || share);
  }

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-theme={mktPage || login || share ? "studio" : theme} className="pb-studio" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {appChrome && <AppShell theme={theme} locale={locale} onTheme={onTheme} onLocale={onLocale} />}
        {mktPage && <StudioNav locale={locale} onLocale={onLocale} />}
        {login && (
          <div className="login-tools">
            <button type="button" className="sq" onClick={onLocale}>{locale === "ar" ? "EN" : "ع"}</button>
          </div>
        )}
        <AuthGuard>
          <main className={landing || login || mktPage ? "flush" : undefined}>{children}</main>
        </AuthGuard>
      </body>
    </html>
  );
}
