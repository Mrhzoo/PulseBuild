"use client";

import { FormEvent, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function ContactPage() {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const res = await fetch(`${API}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        company: form.get("company"),
        message: form.get("message"),
      }),
    });
    if (!res.ok) { setError("Could not send. Try email."); return; }
    setOk(true);
  }
  if (ok) return <article className="mkt-page"><h1>Contact</h1><p className="card">Received. We will reply by email.</p></article>;
  return (
    <article className="mkt-page">
      <h1>Contact</h1>
      <p className="sub">Sales and pilots. Briefings stay on email.</p>
      <form className="card" onSubmit={(e) => void onSubmit(e)}>
        <label>Name</label><input name="name" required />
        <label>Email</label><input name="email" type="email" required />
        <label>Company</label><input name="company" />
        <label>Message</label><input name="message" required />
        <button type="submit">Send</button>
        {error && <p className="ev">{error}</p>}
      </form>
    </article>
  );
}
