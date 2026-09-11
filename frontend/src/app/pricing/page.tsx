"use client";

const PILOT = process.env.NEXT_PUBLIC_PRICE_PILOT || "AED 1,500/mo";
const PACK = process.env.NEXT_PUBLIC_PRICE_PACK || "AED 400/project/mo";

export default function PricingPage() {
  return (
    <article className="mkt-page">
      <p className="mono-label">Pricing · AED · UAE first</p>
      <h1>Pilot first. Pack when the archive grows.</h1>
      <p className="lede">Founder-led pilots. Cancel-friendly monthly after pilot proof. No invented annual badges.</p>
      <div className="plates">
        <div className="plate rec">
          <p className="mono-label">Recommended</p>
          <h2>Pilot</h2>
          <p className="lede">Best for a single SME running a paid pilot on live projects.</p>
          <p className="serif" style={{ fontSize: 28 }}>{PILOT}</p>
          <ul>
            <li>Morning email briefing (SLA)</li>
            <li>Act / Watch with evidence gate</li>
            <li>Upload + forward ingest</li>
            <li>Flag + proof share</li>
            <li>Owner / Ops / Reader</li>
            <li>WhatsApp optional, best-effort</li>
          </ul>
          <a className="sq fill" href="/contact">Request pilot</a>
        </div>
        <div className="plate">
          <p className="mono-label">Add-on</p>
          <h2>Project pack</h2>
          <p className="lede">Add capacity when active projects or archives grow.</p>
          <p className="serif" style={{ fontSize: 28 }}>{PACK}</p>
          <ul>
            <li>Extra active project slots</li>
            <li>Same digest and evidence rules</li>
            <li>Same tenant isolation</li>
            <li>Billed monthly in AED</li>
          </ul>
          <a className="sq" href="/login">Add pack</a>
        </div>
      </div>
      <section className="assisted">
        <p className="mono-label">Assisted ops</p>
        <h2>Founder-led assisted ops</h2>
        <p className="lede">Time-capped human help during pilot weeks. Not a self-serve tier. Not a fourth pricing column.</p>
        <a className="sq" href="/contact">Talk to founder</a>
      </section>
      <table className="compare">
        <thead><tr><th>Group</th><th>Pilot</th><th>Pack</th></tr></thead>
        <tbody>
          <tr><td>Briefing</td><td>Email SLA</td><td>Same</td></tr>
          <tr><td>Projects</td><td>Pilot quota</td><td>+ slots</td></tr>
          <tr><td>WhatsApp</td><td>Optional</td><td>Optional</td></tr>
          <tr><td>Assisted</td><td>By arrangement</td><td>By arrangement</td></tr>
        </tbody>
      </table>
      <h2>FAQ</h2>
      <div className="deflist">
        <div><span className="mono-label">BILLING</span><span>Monthly AED after pilot proof. Stripe live when configured.</span><span /></div>
        <div><span className="mono-label">SLA</span><span>Email at 06:00 Asia/Dubai. WhatsApp is not the SLA.</span><span /></div>
        <div><span className="mono-label">DATA</span><span>Tenant isolation. Encrypted files at rest.</span><span /></div>
        <div><span className="mono-label">CANCEL</span><span>Cancel-friendly monthly after the pilot window.</span><span /></div>
      </div>
    </article>
  );
}
