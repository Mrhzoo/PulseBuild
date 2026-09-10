"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/app", label: "Digest" },
  { href: "/app#projects", label: "Projects" },
  { href: "/flags", label: "Flags" },
  { href: "/billing", label: "Billing" },
  { href: "/onboarding", label: "Onboarding" },
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

  function signOut() {
    localStorage.removeItem("pb_token");
    localStorage.removeItem("pb_role");
    window.location.href = "/";
  }

  return (
    <header className="shell">
      <a className="shell-logo" href="/">
        <span className="logo-circle">PB</span>
        <strong>PulseBuild</strong>
      </a>
      <nav className="shell-nav">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className={path === l.href || (l.href === "/app" && path === "/app") ? "active" : ""}>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="shell-actions">
        <button type="button" onClick={onTheme}>{theme === "dark" ? "Light" : "Dark"}</button>
        <button type="button" onClick={onLocale}>{locale === "ar" ? "EN" : "ع"}</button>
        <button type="button" onClick={signOut}>Sign out</button>
        <button type="button" className="burger-app" onClick={() => setOpen((v) => !v)} aria-label="Menu">☰</button>
      </div>
      {open && (
        <div className="shell-drawer">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      )}
    </header>
  );
}
