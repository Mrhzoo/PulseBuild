"use client";
import { useEffect } from "react";
export default function OnboardingRedirect() {
  useEffect(() => { window.location.replace("/app/onboarding"); }, []);
  return <p className="muted">Redirecting…</p>;
}
