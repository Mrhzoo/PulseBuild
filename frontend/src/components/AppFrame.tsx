"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppShell from "./AppShell";
import AuthGuard from "./AuthGuard";
import StudioNav from "./StudioNav";
import RouteProgress from "./RouteProgress";
import ThemeLocale from "./ThemeLocale";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

function applyDom(theme: string, locale: string) {
  document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
  document.documentElement.lang = locale === "ar" ? "ar" : "en";
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

const MKT = ["/", "/product", "/case-studies", "/contact", "/pricing"];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const landing = pathname === "/";
  const login = pathname === "/login";
  const share = pathname.startsWith("/share");
  const mktPage = MKT.includes(pathname);
  const appChrome = !landing && !login && !share && !mktPage;
  const [locale, setLocale] = useState("en");
  const [theme, setTheme] = useState("light");
  const t = (locale === "ar" ? ar : en) as Record<string, string>;

  useEffect(() => {
    const loc = document.documentElement.lang === "ar" || localStorage.getItem("pb_locale") === "ar" ? "ar" : "en";
    const stored = localStorage.getItem("pb_theme");
    const th = stored === "dark" || document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    if (stored === "studio") localStorage.setItem("pb_theme", "light");
    setLocale(loc);
    setTheme(th);
    applyDom(th, loc);
  }, []);

  function onTheme() {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("pb_theme", next);
    setTheme(next);
    applyDom(next, locale);
    document.documentElement.classList.add("theme-anim");
    window.setTimeout(() => document.documentElement.classList.remove("theme-anim"), 600);
  }
  function onLocale() {
    const next = locale === "ar" ? "en" : "ar";
    localStorage.setItem("pb_locale", next);
    setLocale(next);
    applyDom(theme, next);
  }

  return (
    <>
      <RouteProgress />
      {appChrome && <AppShell theme={theme} locale={locale} onTheme={onTheme} onLocale={onLocale} />}
      {mktPage && <StudioNav locale={locale} theme={theme} onLocale={onLocale} onTheme={onTheme} />}
      {login && (
        <div className="login-tools">
          <ThemeLocale theme={theme} locale={locale} onTheme={onTheme} onLocale={onLocale} t={t} />
        </div>
      )}
      <AuthGuard>
        <main className={landing || login || mktPage || share ? "flush" : undefined}>{children}</main>
      </AuthGuard>
    </>
  );
}
