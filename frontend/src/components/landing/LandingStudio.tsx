"use client";

import { useEffect, useState } from "react";
import StudioFooter from "../StudioFooter";

const SLA_MIN = 6 * 60;

function dubaiClock() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value || 0);
  const minutes = h * 60 + m;
  const toSla = minutes <= SLA_MIN ? SLA_MIN - minutes : 24 * 60 - minutes + SLA_MIN;
  const progress = minutes <= SLA_MIN ? minutes / SLA_MIN : 1;
  return { local: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} Asia/Dubai`, minutesToSla: toSla, progressPct: Math.round(progress * 100), progress };
}

export default function LandingStudio() {
  const [clock, setClock] = useState(dubaiClock);
  const [scroll, setScroll] = useState(0);
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const tick = () => setClock(dubaiClock());
    tick();
    const id = window.setInterval(tick, 30000);
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const vh = window.innerHeight || 1;
        setScroll(Math.min(1, y / vh));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.clearInterval(id);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const lift = reduce ? 0 : scroll;
  const up = lift * 20;
  const down = lift * 20;
  const rise = lift * 24;
  const scale = 1 + lift * 0.04;
  const markerLeft = 8 + clock.progress * 84;
  const markerTop = 78 - Math.sin(clock.progress * Math.PI) * 58;

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <p className="mono-label">UAE · SAUDI · CONSTRUCTION SME</p>
          <h1>Morning risk, <span className="pigment">before margin slips.</span></h1>
          <p className="lede">Morning project-risk briefings for subcontractors and suppliers. Upload or forward project files; get Act and Watch before margin moves.</p>
          <div className="hero-actions">
            <a className="sq fill" href="/login">Sign in</a>
            <a className="sq" href="/product">Product</a>
          </div>
        </div>
        <p className="hero-caption mono-label">Email is the SLA. WhatsApp is best-effort.</p>
        <div className="split" aria-hidden>
          <div className="split-line upper" style={{ transform: `translateY(-${up}vh)` }}>Pulse</div>
          <div className="split-line lower" style={{ transform: `translateY(${down}vh)` }}>Build<span className="dot">.</span></div>
        </div>
        <img
          className="cutout"
          src="/landing/subject.svg"
          alt=""
          width={420}
          height={720}
          style={{ transform: `translateY(-${rise}vh) scale(${scale})`, height: "min(72vh, 640px)", width: "auto" }}
        />
      </section>

      <section className="sec">
        <div className="sec-grid">
          <div>
            <h2>The briefing is a drawing of risk, <span className="pigment">not a dashboard of vanity.</span></h2>
            <p className="lede">Act needs a human move and an evidence pointer. Watch tracks programme or supplier movement. Quiet projects are a feature.</p>
            <div className="deflist">
              <div><span className="mono-label">ACT</span><span>Evidence-gated items that need a human move</span><span>pointer required</span></div>
              <div><span className="mono-label">WATCH</span><span>Programme / supplier movement to keep an eye on</span><span>digest card</span></div>
              <div><span className="mono-label">SLA</span><span>Morning briefing delivery window</span><span>Asia/Dubai 06:00</span></div>
              <div><span className="mono-label">CHANNEL</span><span>Primary path</span><span>email</span></div>
            </div>
          </div>
          <svg viewBox="0 0 320 200" width="320" height="200" aria-label="Digest card to scale">
            <rect x="8" y="20" width="304" height="160" fill="none" stroke="#1A1917" strokeWidth="1" />
            <line x1="8" y1="20" x2="8" y2="180" stroke="#9B3418" strokeWidth="3" />
            <text x="20" y="48" fontFamily="Azeret Mono" fontSize="10" fill="#6E6A61">ACT · POINTER</text>
            <text x="20" y="78" fontFamily="Instrument Serif" fontSize="22" fill="#1A1917">Programme slip</text>
            <text x="20" y="108" fontFamily="Azeret Mono" fontSize="11" fill="#4A4741">doc#p3 · evidence required</text>
            <line x1="20" y1="140" x2="200" y2="140" stroke="#1A1917" strokeWidth="1" />
            <text x="20" y="164" fontFamily="Azeret Mono" fontSize="10" fill="#9B3418">No number without a source</text>
          </svg>
        </div>
      </section>

      <section className="study">
        <p className="mono-label">Computed study · Morning run</p>
        <h2>Briefing fires at 06:00 Asia/Dubai.</h2>
        <div className="arc" aria-hidden>
          <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
            <path d="M8 80 Q 50 10 92 80" fill="none" stroke="#1A1917" strokeWidth="0.6" />
          </svg>
          <span className="arc-marker" style={{ left: `${markerLeft}%`, top: `${markerTop}%` }} />
        </div>
        <div className="deflist">
          <div><span className="mono-label">LOCAL</span><span>{clock.local}</span><span /></div>
          <div><span className="mono-label">MINUTES TO SLA</span><span>{clock.minutesToSla}</span><span /></div>
          <div><span className="mono-label">PROGRESS</span><span>{clock.progressPct}%</span><span>midnight → 06:00</span></div>
        </div>
      </section>

      <section className="sec">
        <h2>Material and practice</h2>
        <div className="deflist">
          <div><span className="mono-label">GATE</span><span>Act cards require an evidence pointer. Empty projects invent nothing.</span><span /></div>
          <div><span className="mono-label">TENANT</span><span>Isolation on every query. Cross-tenant ids 404.</span><span /></div>
          <div><span className="mono-label">INGEST</span><span>Upload or forward project mail. Scan-only PDFs stay needs_ocr — we do not invent text.</span><span /></div>
          <div><span className="mono-label">SHARE</span><span>Flag + secret proof link for GC coordination. Not a live portal.</span><span /></div>
          <div><span className="mono-label">PRICE</span><span>AED pilot. See <a href="/pricing">pricing</a>.</span><span /></div>
        </div>
      </section>

      <section className="sec">
        <p className="mono-label">Work</p>
        <table className="work-table">
          <thead><tr><th>Project</th><th>Type</th><th>Status</th><th>Note</th></tr></thead>
          <tbody>
            <tr><td className="proj">Marina Fitout (demo)</td><td>Fit-out</td><td>Seed</td><td>Programme movement → Watch</td></tr>
            <tr><td className="proj">Act / Watch digest</td><td>Product</td><td>Live</td><td>Daily briefing</td></tr>
            <tr><td className="proj">Flag + share pack</td><td>Coordination</td><td>Live</td><td>GC pack</td></tr>
            <tr><td className="proj">Pilot checklist</td><td>Ops</td><td>Live</td><td>Deploy readiness</td></tr>
          </tbody>
        </table>
      </section>

      <section className="sec">
        <h2>See the risk <span className="pigment">before it hits cash.</span></h2>
        <p className="mono-label">Founder-led pilots for UAE construction SMEs.</p>
        <div className="hero-actions">
          <a className="sq fill" href="/login">Sign in</a>
          <a className="sq" href="/contact">Contact</a>
        </div>
        <div className="close-mark" aria-hidden>PulseBuild.</div>
        <StudioFooter />
      </section>
    </div>
  );
}
