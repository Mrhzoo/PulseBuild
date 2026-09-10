"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const ALL = [
  { href: "/app", label: "Digest", roles: ["owner", "ops", "reader"] },
  { href: "/app/projects", label: "Projects", roles: ["owner", "ops", "reader"] },
  { href: "/app/flags", label: "Flags", roles: ["owner", "ops", "reader"] },
  { href: "/app/billing", label: "Billing", roles: ["owner", "ops"] },
  { href: "/app/onboarding", label: "Onboarding", roles: ["owner", "ops"] },
  { href: "/app/settings", label: "Settings", roles: ["owner", "ops", "reader"] },
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
  const links = ALL.filter((l) => l.roles.includes(role));

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
        {links.map((l) => (
          <a key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="shell-actions">
        <span className="chip">{role}</span>
        <button type="button" onClick={onTheme}>{theme === "dark" ? "Light" : "Dark"}</button>
        <button type="button" onClick={onLocale}>{locale === "ar" ? "EN" : "ع"}</button>
        <button type="button" onClick={signOut}>Sign out</button>
        <button type="button" className="burger-app" onClick={() => setOpen((v) => !v)} aria-label="Menu">☰</button>
      </div>
      {open && (
        <div className="shell-drawer">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      )}
    </header>
  );
}
