"use client";

import { useEffect, useState } from "react";
import AppPage from "../../../components/motion/AppPage";
import en from "../../../i18n/en.json";
import ar from "../../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type FlagRow = {
  id: string;
  title: string;
  note: string;
  project_name: string;
  created_at: string | null;
  share_url: string | null;
  share_revoked: boolean;
  pack?: boolean;
};

function token() {
  return typeof window === "undefined" ? "" : localStorage.getItem("pb_token") || "";
}

export default function FlagsWorkspace() {
  const [locale, setLocale] = useState("en");
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const role = typeof window !== "undefined" ? localStorage.getItem("pb_role") || "" : "";
  const canWrite = role === "owner" || role === "ops";
  const [rows, setRows] = useState<FlagRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const [packUrl, setPackUrl] = useState("");

  async function load() {
    const res = await fetch(`${API}/api/flags`, { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) {
      setError(t.flags_load_error);
      return;
    }
    setRows(await res.json());
  }

  useEffect(() => {
    setLocale(localStorage.getItem("pb_locale") || "en");
    void load();
  }, []);

  async function revoke(id: string) {
    await fetch(`${API}/api/flags/${id}/revoke-share`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
    void load();
  }
  async function dismiss(id: string) {
    await fetch(`${API}/api/flags/${id}/dismiss`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "closed" }),
    });
    void load();
  }
  async function pack() {
    const res = await fetch(`${API}/api/flags/pack`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
    const data = await res.json();
    if (res.ok) {
      setPackUrl(data.share_url || "");
      void load();
    }
  }

  const open = rows.filter((r) => !r.share_revoked);
  const revoked = rows.filter((r) => r.share_revoked);

  return (
    <AppPage as="article">
      <h1>{t.flags_title}</h1>
      <p className="sub">{t.flags_sub}</p>
      {canWrite && <p><button type="button" className="ae-btn" onClick={() => void pack()}>{t.pack_create}</button></p>}
      {packUrl && <p className="ask-banner">{t.pack_ready} <button type="button" className="ae-btn ghost" onClick={() => { void navigator.clipboard.writeText(packUrl); setCopied("pack"); }}>{copied === "pack" ? t.copied : t.copy_share}</button></p>}
      {error && <div className="ae-card">{error}</div>}
      {open.length === 0 && (
        <div className="ae-empty">{t.flags_empty} <a className="ae-btn" href="/app">{t.open_digest}</a></div>
      )}
      {open.map((row) => (
        <article className="ae-card dash-card act" key={row.id}>
          <div className="dash-meta">
            <span className="sev-pill">{row.pack ? t.pack_label : row.project_name}</span>
            <span className="muted">{row.created_at}</span>
          </div>
          <h3>{row.pack ? t.pack_label : row.title}</h3>
          <p className="why">{row.pack ? t.pack_watermark : row.note}</p>
          <div className="dash-actions">
            {row.share_url && (
              <button type="button" className="ae-btn" onClick={() => { void navigator.clipboard.writeText(row.share_url || ""); setCopied(row.id); }}>
                {copied === row.id ? t.copied : t.copy_share}
              </button>
            )}
            {canWrite && row.share_url && <button type="button" className="ae-btn ghost" onClick={() => void revoke(row.id)}>{t.revoke_share}</button>}
            {canWrite && <button type="button" className="ae-btn ghost" onClick={() => void dismiss(row.id)}>{t.dismiss_flag}</button>}
          </div>
        </article>
      ))}
      {revoked.length > 0 && (
        <section>
          <h2>{t.flags_revoked_title}</h2>
          <p className="sub">{t.flags_revoked_sub}</p>
          {revoked.map((row) => (
            <article className="ae-card" key={row.id}>
              <div className="dash-meta">
                <span className="chip">{t.share_revoked}</span>
                <span className="muted">{row.created_at}</span>
              </div>
              <h3>{row.pack ? t.pack_label : row.title}</h3>
              <p className="why">{row.pack ? t.pack_watermark : row.note}</p>
            </article>
          ))}
        </section>
      )}
    </AppPage>
  );
}
