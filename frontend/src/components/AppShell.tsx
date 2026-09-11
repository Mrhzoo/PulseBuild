"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeLocale from "./ThemeLocale";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

const ALL = [
  { href: "/app", key: "nav_digest", roles: ["owner", "ops", "reader"] },
  { href: "/app/projects", key: "projects", roles: ["owner", "ops", "reader"] },
  { href: "/app/flags", key: "flags", roles: ["owner", "ops", "reader"] },
  { href: "/app/billing", key: "billing", roles: ["owner", "ops"] },
  { href: "/app/onboarding", key: "onboarding", roles: ["owner", "ops"] },
  { href: "/app/settings", key: "settings", roles: ["owner", "ops", "reader"] },
];

export default function AppShell({
  theme,
  locale,
  onTheme,
  onLocale,
}: {
  theme: string;
  locale: string;
  onTheme: () => void;
  onLocale: () => void;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const role = typeof window !== "undefined" ? localStorage.getItem("pb_role") || "reader" : "reader";
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const links = ALL.filter((l) => l.roles.includes(role));

  function signOut() {
    localStorage.removeItem("pb_token");
    localStorage.removeItem("pb_role");
    window.location.href = "/";
  }

  return (
    <header className="ae-nav ae-shell">
      <Link className="wordmark" href="/">PulseBuild.</Link>
      <nav>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
            {t[l.key] || l.key}
          </Link>
        ))}
      </nav>
      <div className="tools">
        <span className="chip">{role}</span>
        <ThemeLocale theme={theme} locale={locale} onTheme={onTheme} onLocale={onLocale} t={t} />
        <button type="button" className="ae-btn ghost" onClick={signOut}>{t.logout}</button>
        <button type="button" className="ae-icon burger-app" onClick={() => setOpen((v) => !v)} aria-label={t.menu}>{t.menu}</button>
      </div>
      {open && (
        <div className="shell-drawer">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{t[l.key] || l.key}</Link>
          ))}
          <button type="button" className="ae-btn ghost" onClick={signOut}>{t.logout}</button>
        </div>
      )}
    </header>
  );
}
