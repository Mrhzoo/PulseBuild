"use client";

const PILOT = process.env.NEXT_PUBLIC_PRICE_PILOT || "AED 1,500 / month";
const PACK = process.env.NEXT_PUBLIC_PRICE_PACK || "AED 400 / project / month";

export default function PricingPage() {
  const loggedIn = typeof window !== "undefined" && !!localStorage.getItem("pb_token");
  const cta = loggedIn ? "/app/billing" : "/login?next=/app/billing";
  return (
    <article className="mkt-page">
      <h1>Pricing</h1>
      <p className="sub">AED. Email is the morning SLA. WhatsApp is optional. Compliance is a Watch-capable agent, not a separate SKU.</p>
      <section className="card">
        <h2>Pilot</h2>
        <p className="login-title">{PILOT}</p>
        <p>3 projects. Owner + Ops + Reader. Morning email digest. Flag and share.</p>
        <p><a className="cta-btn" href={cta}>Start pilot</a></p>
      </section>
      <section className="card">
        <h2>Extra project pack</h2>
        <p className="login-title">{PACK}</p>
        <p>Adds project quota on the same tenant.</p>
        <p><a className="cta-btn" href={cta}>Add projects</a></p>
      </section>
    </article>
  );
}
