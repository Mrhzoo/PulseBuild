"use client";

import { FormEvent, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    await fetch(`${API}/api/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    setSent(true);
  }
  return (
    <article className="mkt-page">
      <p className="mono-label">Access</p>
      <h1>Request a founder-led pilot.</h1>
      <p className="lede">Tell us the last delayed IPC or surprise variation. We will reply by email. No chatbot.</p>
      <form onSubmit={(e) => void onSubmit(e)}>
        <label className="mono-label">Name</label>
        <input name="name" required />
        <label className="mono-label">Company</label>
        <input name="company" required />
        <label className="mono-label">Email</label>
        <input name="email" type="email" required />
        <label className="mono-label">City</label>
        <input name="city" placeholder="Dubai / Riyadh" />
        <label className="mono-label">Note</label>
        <input name="note" placeholder="Last cash-flow or change-order wound" />
        <button className="sq fill" type="submit">Send note</button>
      </form>
      {sent && <p className="ask-banner">Note queued. Reply comes by email.</p>}
    </article>
  );
}
