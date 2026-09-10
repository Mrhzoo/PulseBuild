"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC = ["/", "/login"];

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
    if (!isPublic(path) && !token) {
      router.replace("/login");
      return;
    }
    if (path === "/login" && token) {
      router.replace("/app");
      return;
    }
    setReady(true);
  }, [path, router]);

  if (!ready && !isPublic(path)) return null;
  return <>{children}</>;
}
