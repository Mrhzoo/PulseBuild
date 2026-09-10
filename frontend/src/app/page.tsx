"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Card = {
  id: string;
  project_name: string;
  severity: string;
  title: string;
  why_it_hits_us: string;
  evidence_snippet: string;
  evidence_pointer: string;
  confidence: number;
};

type Digest = {
  date: string;
  channel_promise: string;
  act: Card[];
  watch: Card[];
  quiet_projects: string[];
  unassigned_count: number;
  ask: string | null;
};

function token(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("pb_token") || "";
}

function RiskCard({ card, canWrite }: { card: Card; canWrite: boolean }) {
  const [note, setNote] = useState("This affects us");
  const [share, setShare] = useState<string | null>(null);

  async function flag() {
    const res = await fetch(`${API}/api/findings/${card.id}/flag`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (res.ok) {
      const data = await res.json();
      setShare(data.share_url || data.share_token || "ok");
    }
  }

  async function dismiss() {
    await fetch(`${API}/api/findings/${card.id}/dismiss`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "not material" }),
    });
  }

  return (
    <article className={`card ${card.severity}`}>
      <div className="sev">
        {card.severity.toUpperCase()} · {card.project_name}
        <span className="conf"> · {Math.round(card.confidence * 100)}%</span>
      </div>
      <h3>{card.title}</h3>
      <p className="why">{card.why_it_hits_us}</p>
      <p className="ev">{card.evidence_snippet} · {card.evidence_pointer}</p>
      {canWrite && (
        <div>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
          <button type="button" onClick={() => void flag()}>This affects us</button>
          <button type="button" onClick={() => void dismiss()}>Dismiss</button>
        </div>
      )}
      {share && <p className="ev">Share link ready</p>}
    </article>
  );
}

export default function HomePage() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [role, setRole] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const headers: Record<string, string> = {};
    const t = token();
    if (t) headers.Authorization = `Bearer ${t}`;
    try {
      const res = await fetch(`${API}/api/digest/today`, { cache: "no-store", headers });
      if (res.ok) {
        setDigest(await res.json());
        setNeedLogin(false);
      } else if (res.status === 401) {
        setNeedLogin(true);
        setError(null);
      } else setError("Digest is unavailable. No invented risks are shown.");
    } catch {
      setError("API is not connected yet. Start the backend, then refresh.");
    }
  }

  useEffect(() => {
    setRole(localStorage.getItem("pb_role") || "");
    void load();
  }, []);

  async function sendBriefing() {
    setSending(true);
    try {
      const res = await fetch(`${API}/api/digest/today/send`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) setError("Could not send briefing.");
    } finally {
      setSending(false);
    }
  }

  const canSend = role === "owner" || role === "ops";

  return (
    <>
      <h1>Today’s digest</h1>
      <p className="sub">{digest?.channel_promise || "Morning briefing by email."} What threatens cash, crew, or margin this week.</p>
      {needLogin && (
        <div className="card">
          <a href="/login">Sign in to load today’s briefing.</a>
        </div>
      )}
      {canSend && (
        <p>
          <button type="button" onClick={() => void sendBriefing()} disabled={sending}>{sending ? "Sending…" : "Send morning briefing"}</button>{" "}
          <a href="/flags">Open flags</a>
        </p>
      )}
      {error && <div className="card">{error}</div>}
      {digest && digest.act.length === 0 && digest.watch.length === 0 && (
        <div className="card">Quiet morning. Upload a schedule, last IPC, or a variation email.</div>
      )}
      {digest?.act.map((c) => (
        <RiskCard key={c.id} card={c} canWrite={canSend} />
      ))}
      {digest?.watch.map((c) => (
        <RiskCard key={c.id} card={c} canWrite={canSend} />
      ))}
      {digest && digest.quiet_projects.length > 0 && (
        <p className="muted">Quiet: {digest.quiet_projects.join(", ")}</p>
      )}
      {digest?.ask && <p className="sub">{digest.ask}</p>}
    </>
  );
}
