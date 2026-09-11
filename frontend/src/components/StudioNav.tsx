"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import ThemeLocale from "./ThemeLocale";
import en from "../i18n/en.json";
import ar from "../i18n/ar.json";

export default function StudioNav({
  locale,
  theme,
  onLocale,
  onTheme,
}: {
  locale?: string;
  theme?: string;
  onLocale?: () => void;
  onTheme?: () => void;
}) {
  const path = usePathname();
  const reduce = useReducedMotion();
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const links = [
    { href: "/product", label: t.nav_product },
    { href: "/pricing", label: t.nav_pricing },
    { href: "/case-studies", label: t.nav_cases },
    { href: "/contact", label: t.nav_contact },
  ];
  return (
    <motion.header
      className="ae-nav"
      initial={reduce ? false : { y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link className="wordmark" href="/">
        PulseBuild<span className="pigment">.</span>
      </Link>
      <nav>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="tools">
        {onTheme && onLocale && (
          <ThemeLocale theme={theme || "light"} locale={locale || "en"} onTheme={onTheme} onLocale={onLocale} t={t} />
        )}
        <Link className="ae-btn" href="/login">
          {t.login}
        </Link>
      </div>
    </motion.header>
  );
}
