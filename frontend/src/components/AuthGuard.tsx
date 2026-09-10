"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC = ["/", "/login", "/product", "/case-studies", "/contact", "/pricing"];

function isPublic(path: string) {
  if (PUBLIC.includes(path)) return true;
  if (path.startsWith("/marketing")) return true;
  if (path.startsWith("/share")) return true;
  return false;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("pb_token");
    const raw = new URLSearchParams(window.location.search).get("next") || "/app";
    const safeNext = raw.startsWith("/") ? raw : "/app";
    if (!isPublic(path) && !token) {
      router.replace(`/login?next=${encodeURIComponent(path)}`);
      return;
    }
    if (path === "/login" && token) {
      router.replace(safeNext);
      return;
    }
    setReady(true);
  }, [path, router]);

  if (!ready && !isPublic(path)) return null;
  return <>{children}</>;
}
