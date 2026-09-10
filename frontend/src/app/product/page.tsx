"use client";

export default function ProductPage() {
  return (
    <article className="mkt-page">
      <h1>Product</h1>
      <p className="sub">Morning project-risk briefings for UAE subcontractors and suppliers. Email is the SLA. WhatsApp is optional and best-effort.</p>
      <section className="card"><h2>Ingest</h2><p>Upload PDFs and spreadsheets, or forward project mail. Soft match never auto-commits.</p></section>
      <section className="card"><h2>Agents</h2><p>Schedule, cash, change-order, and compliance heuristics. Act cards need an evidence pointer. Empty projects stay quiet.</p></section>
      <section className="card"><h2>Digest</h2><p>One morning briefing: Act / Watch. Flag what hits your crew or cash and share a link.</p></section>
      <p><a className="cta-btn" href="/login">Get Started</a></p>
    </article>
  );
}
