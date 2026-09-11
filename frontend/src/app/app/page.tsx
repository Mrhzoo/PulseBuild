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

type ActivityItem = { kind: string; at: string | null; title: string; note: string; shared: boolean };

function token(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("pb_token") || "";
}

function ActRow({ card, canWrite, t, kind }: { card: Card; canWrite: boolean; t: Record<string, string>; kind: "act" | "watch" }) {
  const [share, setShare] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  async function flag() {
    const res = await fetch(`${API}/api/findings/${card.id}/flag`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ note: t.flag_this }),
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
    <article className={`inbox-row ${kind}`}>
      <span className="tick" />
      <div>
        <h3>{card.title}</h3>
        <p className="muted">{card.why_it_hits_us}</p>
        <p className="ev">{card.evidence_pointer}</p>
        {share && <p className="ev">{share}</p>}
      </div>
      {canWrite && (
        <div className="dash-actions">
          <button type="button" className="ae-btn" onClick={() => void flag()}>{t.flag_this}</button>
          <button type="button" className="ae-btn ghost" onClick={() => void dismiss()}>{t.dismiss}</button>
        </div>
      )}
    </article>
  );
}

export default function DigestAppPage() {
  const [locale, setLocale] = useState("en");
  const [digest, setDigest] = useState<Digest | null>(null);
  const [exposure, setExposure] = useState<Exposure | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
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
      } else if (res.status === 401) setNeedLogin(true);
      else setError(t.errors_unavailable);
      const exp = await fetch(`${API}/api/digest/exposure`, { cache: "no-store", headers });
      if (exp.ok) setExposure(await exp.json());
      const act = await fetch(`${API}/api/activity`, { cache: "no-store", headers });
      if (act.ok) {
        const data = await act.json();
        setActivity(data.items || []);
      }
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
    try {
      const res = await fetch(`${API}/api/digest/today/send`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 503 ? t.send_email_unconfigured : t.send_failed);
        return;
      }
      const via = String(data.delivered_via || "");
      setSent(via === "stub" ? t.send_stub : t.send_ok);
      void load();
    } finally {
      setSending(false);
    }
  }

  const canWrite = role === "owner" || role === "ops";
  const empty = digest && digest.act.length === 0 && digest.watch.length === 0;

  return (
    <div className="ae-page">
      <header>
        <p className="mono-label">{digest?.date} · {digest?.company || digest?.tenant || ""}</p>
        <h1>{t.command_title}</h1>
        <p className="sub">{digest?.channel_promise || t.channel_promise}</p>
        {canWrite && (
          <div className="dash-toolbar">
            <button type="button" className="ae-btn" onClick={() => void sendBriefing()} disabled={sending}>{sending ? t.sending : t.send_briefing}</button>
            <button type="button" className="ae-btn ghost" onClick={() => void load()}>{t.refresh}</button>
          </div>
        )}
        {sent && <p className="muted">{sent}</p>}
      </header>
      {exposure && (
        <div className="ae-stat-row exposure">
          <div className="ae-tile"><div className="k">{t.exposure_open_act}</div><div className="v">{exposure.open_act}</div></div>
          <div className="ae-tile"><div className="k">{t.exposure_open_watch}</div><div className="v">{exposure.open_watch}</div></div>
          <div className="ae-tile ae-sun" aria-hidden />
          <div className="ae-tile"><div className="k">{t.exposure_days}</div><div className="v">{exposure.days_flagged ?? "—"}</div></div>
          <div className="ae-tile">
            <div className="k">{t.exposure_margin}</div>
            <div className="v" style={{ fontSize: 22 }}>{exposure.margin_at_risk == null ? "—" : `AED ${exposure.margin_at_risk}`}</div>
            {exposure.aed_per_delay_day == null && <a className="ae-btn ghost" href="/app/settings">{t.set_aed_per_day}</a>}
          </div>
        </div>
      )}
      {exposure && <p className="muted">{t.exposure_note} · {t.exposure_shared}: {exposure.shared}</p>}
      {needLogin && <div className="ae-empty"><a className="ae-btn" href="/login">{t.sign_in_link}</a></div>}
      {error && <div className="ae-card">{error}</div>}
      {empty && (
        <div className="ae-empty">
          <p>{t.quiet_morning}</p>
          <a className="ae-btn" href="/app/projects">{t.upload}</a>
        </div>
      )}
      {digest && (
        <div className="ae-command">
          <section>
            <p className="mono-label">{t.act_inbox}</p>
            {digest.act.map((c) => <ActRow key={c.id} card={c} canWrite={canWrite} t={t} kind="act" />)}
            {digest.act.length === 0 && <p className="muted">{t.quiet_morning}</p>}
          </section>
          <section>
            <p className="mono-label">{t.watch_rail}</p>
            {digest.watch.map((c) => (
              <div key={c.id} className="rail-item">
                <strong>{c.title}</strong>
                <p className="ev">{c.evidence_pointer}</p>
              </div>
            ))}
          </section>
          <section>
            <p className="mono-label">{t.activity_panel}</p>
            {activity.map((item, i) => (
              <div key={`${item.kind}-${i}`} className="act-feed">
                <span className="mono-label">{item.kind}</span>
                <p>{item.title}</p>
                <p className="muted">{item.note}</p>
              </div>
            ))}
            {activity.length === 0 && <p className="muted">{t.activity_empty}</p>}
          </section>
        </div>
      )}
      {digest?.ask && <aside className="ask-banner">{digest.ask}</aside>}
    </div>
  );
}
