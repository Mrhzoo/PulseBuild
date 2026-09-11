"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
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
      <a className="wordmark" href="/">PulseBuild.</a>
      <nav>
        {links.map((l) => (
          <a key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
            {t[l.key] || l.key}
          </a>
        ))}
      </nav>
      <div className="tools">
        <span className="chip">{role}</span>
        <button type="button" className="ae-btn ghost" onClick={onTheme}>{theme === "dark" ? t.theme_light : t.theme_dark}</button>
        <button type="button" className="ae-btn ghost" onClick={onLocale}>{locale === "ar" ? "EN" : "ع"}</button>
        <button type="button" className="ae-btn ghost" onClick={signOut}>{t.logout}</button>
        <button type="button" className="ae-btn ghost burger-app" onClick={() => setOpen((v) => !v)} aria-label={t.menu}>{t.menu}</button>
      </div>
      {open && (
        <div className="shell-drawer">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{t[l.key] || l.key}</a>
          ))}
          <button type="button" className="ae-btn ghost" onClick={signOut}>{t.logout}</button>
        </div>
      )}
    </header>
  );
}
