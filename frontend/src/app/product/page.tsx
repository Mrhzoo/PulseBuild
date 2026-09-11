"use client";

export default function ProductPage() {
  return (
    <article className="mkt-page">
      <p className="mono-label">Product</p>
      <h1>A morning briefing, <span className="pigment">not an ERP.</span></h1>
      <p className="lede">PulseBuild is not BIM, not a chatbot, not a document warehouse. It is Act and Watch on live project files.</p>
      <h2>Digest anatomy</h2>
      <div className="deflist">
        <div><span className="mono-label">ACT</span><span>Needs a human move. Evidence pointer required.</span><span /></div>
        <div><span className="mono-label">WATCH</span><span>Programme or supplier movement to track.</span><span /></div>
        <div><span className="mono-label">QUIET</span><span>Quiet projects are a feature.</span><span /></div>
      </div>
      <h2>Ingest</h2>
      <p className="lede">Upload a programme, last IPC, or variation email. Or forward project mail to the address on the project.</p>
      <h2>Roles</h2>
      <div className="deflist">
        <div><span className="mono-label">OWNER</span><span>Billing, invite, run agents, send briefing.</span><span /></div>
        <div><span className="mono-label">OPS</span><span>Write path without billing admin.</span><span /></div>
        <div><span className="mono-label">READER</span><span>See digest and flags. Cannot upload.</span><span /></div>
      </div>
      <p className="mono-label">Email is the SLA. WhatsApp is best-effort.</p>
      <div className="hero-actions">
        <a className="sq fill" href="/login">Sign in</a>
        <a className="sq" href="/pricing">Pricing</a>
      </div>
    </article>
  );
}
