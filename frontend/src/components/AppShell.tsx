"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
  const reduce = useReducedMotion();
  const role = typeof window !== "undefined" ? localStorage.getItem("pb_role") || "reader" : "reader";
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const links = ALL.filter((l) => l.roles.includes(role));

  function signOut() {
    localStorage.removeItem("pb_token");
    localStorage.removeItem("pb_role");
    window.location.href = "/";
  }

  return (
    <motion.header
      className="ae-nav ae-shell"
      initial={reduce ? false : { y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link className="wordmark" href="/">PulseBuild.</Link>
      <nav>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
            {t[l.key] || l.key}
          </Link>
        ))}
      </nav>
      <div className="tools">
        <span className="app-live"><span className="status-dot"><span className="status-ring" /></span>live</span>
        <span className="chip">{role}</span>
        <ThemeLocale theme={theme} locale={locale} onTheme={onTheme} onLocale={onLocale} t={t} />
        <button type="button" className="ae-btn ghost" onClick={signOut}>{t.logout}</button>
        <button type="button" className="ae-icon burger-app" onClick={() => setOpen((v) => !v)} aria-label={t.menu}>{t.menu}</button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="shell-drawer"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28 }}
          >
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{t[l.key] || l.key}</Link>
            ))}
            <button type="button" className="ae-btn ghost" onClick={signOut}>{t.logout}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
