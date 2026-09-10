"use client";
import { useEffect } from "react";
export default function BillingRedirect() {
  useEffect(() => { window.location.replace("/app/billing" + window.location.search); }, []);
  return <p className="muted">Redirecting…</p>;
}
