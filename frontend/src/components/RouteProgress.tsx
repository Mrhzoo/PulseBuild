"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteProgress() {
  const pathname = usePathname();
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(true);
    const id = window.setTimeout(() => setOn(false), 520);
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    function go(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (href.startsWith("/") && !href.startsWith("//") && href !== pathname) setOn(true);
    }
    document.addEventListener("click", go, true);
    return () => document.removeEventListener("click", go, true);
  }, [pathname]);

  return (
    <div className={`ae-progress ${on ? "on" : ""}`} aria-hidden>
      <span />
    </div>
  );
}
