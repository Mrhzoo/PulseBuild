"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import AppShell from "../components/AppShell";
import AuthGuard from "../components/AuthGuard";

function applyDom(theme: string, locale: string) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const marketing = pathname === "/";
  const login = pathname === "/login";
  const share = pathname.startsWith("/share");
  const appChrome = !marketing && !login && !share;
  const [locale, setLocale] = useState("en");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const loc = localStorage.getItem("pb_locale") || "en";
    const th = localStorage.getItem("pb_theme") || "dark";
    setLocale(loc);
    setTheme(th);
    applyDom(th, loc);
  }, []);

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-theme={theme}>
      <body>
        {appChrome && (
          <AppShell
            theme={theme}
            locale={locale}
            onTheme={() => {
              const next = theme === "dark" ? "light" : "dark";
              localStorage.setItem("pb_theme", next);
              setTheme(next);
              applyDom(next, locale);
            }}
            onLocale={() => {
              const next = locale === "ar" ? "en" : "ar";
              localStorage.setItem("pb_locale", next);
              setLocale(next);
              applyDom(theme, next);
            }}
          />
        )}
        {login && (
          <div className="login-tools">
            <button type="button" onClick={() => {
              const next = theme === "dark" ? "light" : "dark";
              localStorage.setItem("pb_theme", next);
              setTheme(next);
              applyDom(next, locale);
            }}>{theme === "dark" ? "Light" : "Dark"}</button>
            <button type="button" onClick={() => {
              const next = locale === "ar" ? "en" : "ar";
              localStorage.setItem("pb_locale", next);
              setLocale(next);
              applyDom(theme, next);
            }}>{locale === "ar" ? "EN" : "ع"}</button>
          </div>
        )}
        <AuthGuard>
          <main className={marketing || login ? "flush" : undefined}>{children}</main>
        </AuthGuard>
      </body>
    </html>
  );
}
