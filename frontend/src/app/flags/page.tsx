"use client";

import { useEffect } from "react";

export default function FlagsRedirect() {
  useEffect(() => {
    window.location.replace("/app/flags");
  }, []);
  return <p className="muted">Redirecting…</p>;
}
