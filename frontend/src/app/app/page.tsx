"use client";

import { useEffect, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";

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
  tenant?: string;
  company?: string;
  channel_promise: string;
  act: Card[];
  watch: Card[];
  quiet_projects: string[];
  unassigned_count: number;
  last_data_received?: string | null;
  ask: string | null;
};

type Exposure = {
  open_act: number;
  open_watch: number;
  days_flagged: number | null;
  aed_per_delay_day: number | null;
  margin_at_risk: number | null;
  shared: number;
  note: string;
};

function token(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("pb_token") || "";
}

function RiskCard({ card, canWrite, kind, t }: { card: Card; canWrite: boolean; kind: "act" | "watch"; t: Record<string, string> }) {
  const [note, setNote] = useState(t.flag_this);
  const [share, setShare] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  const [copied, setCopied] = useState(false);

  async function flag() {
    const res = await fetch(`${API}/api/findings/${card.id}/flag`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (res.ok) {
      const data = await res.json();
      setShare(data.share_url || (data.share_token ? `${window.location.origin}/share/${data.share_token}` : null));
    }
  }
  async function dismiss() {
    await fetch(`${API}/api/findings/${card.id}/dismiss`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "not material" }),
    });
    setGone(true);
  }
  if (gone) return null;
  return (
    <article className={`dash-card ${kind}`}>
      <div className="dash-meta">
        <span className="sev-pill">{card.severity}</span>
        <span>{card.project_name}</span>
        <span className="conf-pill">{Math.round(card.confidence * 100)}%</span>
      </div>
      <h3>{card.title}</h3>
      <p className="why">{card.why_it_hits_us}</p>
      <p className="ev">{card.evidence_snippet} · {card.evidence_pointer}</p>
      {canWrite && (
        <div className="dash-actions">
          <input value={note} onChange={(e) => setNote(e.target.value)} />
          <button type="button" onClick={() => void flag()}>{t.flag_this}</button>
          <button type="button" onClick={() => void dismiss()}>{t.dismiss}</button>
        </div>
      )}
      {share && (
        <p className="ev">
          <button type="button" onClick={() => { void navigator.clipboard.writeText(share); setCopied(true); }}>
            {copied ? t.copied : t.copy_share}
          </button>
        </p>
      )}
    </article>
  );
}

export default function DigestAppPage() {
  const [locale, setLocale] = useState("en");
  const [digest, setDigest] = useState<Digest | null>(null);
  const [exposure, setExposure] = useState<Exposure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [role, setRole] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");

  const t = (locale === "ar" ? ar : en) as Record<string, string>;

  async function load() {
    const headers: Record<string, string> = {};
    const tok = token();
    if (tok) headers.Authorization = `Bearer ${tok}`;
    try {
      const res = await fetch(`${API}/api/digest/today`, { cache: "no-store", headers });
      if (res.ok) {
        setDigest(await res.json());
        setNeedLogin(false);
        setError(null);
      } else if (res.status === 401) {
        setNeedLogin(true);
      } else setError(t.errors_unavailable);
      const exp = await fetch(`${API}/api/digest/exposure`, { cache: "no-store", headers });
      if (exp.ok) setExposure(await exp.json());
    } catch {
      setError(t.errors_unavailable);
    }
  }

  useEffect(() => {
    setLocale(localStorage.getItem("pb_locale") || "en");
    setRole(localStorage.getItem("pb_role") || "");
    void load();
  }, []);

  async function sendBriefing() {
    setSending(true);
    setSent("");
    setError(null);
    try {
      const res = await fetch(`${API}/api/digest/today/send`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 503 ? t.send_email_unconfigured : t.send_failed);
        return;
      }
      const via = String(data.delivered_via || "");
      const parts = [via === "stub" ? t.send_stub : t.send_ok];
      if (data.whatsapp === "whatsapp") parts.push(t.wa_sent);
      else if (data.whatsapp === "failed") parts.push(t.wa_not_sent);
      setSent(parts.join(" · "));
    } finally {
      setSending(false);
    }
  }

  const canWrite = role === "owner" || role === "ops";
  const empty = digest && digest.act.length === 0 && digest.watch.length === 0;

  return (
    <div className="dash">
      <header className="dash-head">
        <p className="muted">{digest?.date} · {digest?.company || digest?.tenant || ""}</p>
        <h1>{t.digest_title}</h1>
        <p className="sub">{digest?.channel_promise || t.channel_promise}</p>
        {digest && (
          <p className="muted">
            {t.last_data}: {digest.last_data_received || "—"}
            {" · "}
            {t.unassigned}: {digest.unassigned_count}
          </p>
        )}
        {canWrite && (
          <div className="dash-toolbar">
            <button type="button" onClick={() => void sendBriefing()} disabled={sending}>{sending ? t.sending : t.send_briefing}</button>
            <button type="button" onClick={() => void load()}>{t.refresh}</button>
            <a href="/app/flags">{t.open_flags}</a>
          </div>
        )}
        {sent && <p className="muted">{sent}</p>}
      </header>
      {exposure && (
        <div className="exposure">
          <div><span className="mono-label">{t.exposure_open_act}</span><b>{exposure.open_act}</b></div>
          <div><span className="mono-label">{t.exposure_open_watch}</span><b>{exposure.open_watch}</b></div>
          <div><span className="mono-label">{t.exposure_days}</span><b>{exposure.days_flagged ?? "—"}</b></div>
          <div>
            <span className="mono-label">{t.exposure_margin}</span>
            <b>{exposure.margin_at_risk == null ? "—" : `AED ${exposure.margin_at_risk}`}</b>
            {exposure.aed_per_delay_day == null && <a className="sq" href="/app/settings">{t.set_aed_per_day}</a>}
          </div>
          <div><span className="mono-label">{t.exposure_shared}</span><b>{exposure.shared}</b></div>
        </div>
      )}
      {exposure && <p className="muted">{exposure.note || t.exposure_note}</p>}
      {needLogin && <div className="card"><a href="/login">{t.sign_in_link}</a></div>}
      {error && <div className="card">{error}</div>}
      {empty && (
        <div className="card">
          {t.quiet_morning}{" "}
          <a href="/app/projects">{t.upload}</a>
        </div>
      )}
      {digest && digest.act.length > 0 && <h2 className="dash-sec">{t.section_act}</h2>}
      {digest?.act.map((c) => <RiskCard key={c.id} card={c} canWrite={canWrite} kind="act" t={t} />)}
      {digest && digest.watch.length > 0 && <h2 className="dash-sec">{t.section_watch}</h2>}
      {digest?.watch.map((c) => <RiskCard key={c.id} card={c} canWrite={canWrite} kind="watch" t={t} />)}
      {digest && digest.quiet_projects.length > 0 && (
        <p className="chips">{digest.quiet_projects.map((n) => <span key={n} className="chip">{n}</span>)}</p>
      )}
      {digest?.ask && <aside className="ask-banner">{digest.ask}</aside>}
    </div>
  );
}
