"use client";

import { useEffect, useState } from "react";
import AppPage from "../../../components/motion/AppPage";
import en from "../../../i18n/en.json";
import ar from "../../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
type Person = { user_id: string; email: string; name: string; role: string; whatsapp_e164: string | null };

const META = [
  "meta_step_app",
  "meta_step_template",
  "meta_step_phone",
  "meta_step_token",
  "meta_step_webhook",
  "meta_step_enable",
  "meta_step_session",
];

export default function SettingsPage() {
  const [locale, setLocale] = useState("en");
  const [theme, setTheme] = useState("light");
  const [tab, setTab] = useState<"prefs" | "people" | "inbound" | "meta">("prefs");
  const t = (locale === "ar" ? ar : en) as Record<string, string>;
  const role = typeof window !== "undefined" ? localStorage.getItem("pb_role") || "" : "";
  const canWrite = role === "owner" || role === "ops";
  const [people, setPeople] = useState<Person[]>([]);
  const [email, setEmail] = useState("");
  const [temp, setTemp] = useState("");
  const [wa, setWa] = useState("");
  const [inbound, setInbound] = useState<Record<string, any> | null>(null);
  const [pilot, setPilot] = useState<Record<string, any> | null>(null);
  const [aed, setAed] = useState("");
  const [tz, setTz] = useState("Asia/Dubai");
  const [localTime, setLocalTime] = useState("07:00");

  useEffect(() => {
    setLocale(localStorage.getItem("pb_locale") === "ar" ? "ar" : "en");
    const stored = localStorage.getItem("pb_theme");
    setTheme(stored === "dark" ? "dark" : "light");
    const headers = { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}` };
    void fetch(`${API}/api/people`, { headers }).then((r) => (r.ok ? r.json() : [])).then(setPeople);
    void fetch(`${API}/api/inbound/status`, { headers }).then((r) => (r.ok ? r.json() : null)).then(setInbound);
    void fetch(`${API}/api/pilot/checklist`, { headers }).then((r) => (r.ok ? r.json() : null)).then(setPilot);
    void fetch(`${API}/api/settings/tenant`, { headers }).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d?.aed_per_delay_day != null) setAed(String(d.aed_per_delay_day));
      if (d?.digest_timezone) setTz(d.digest_timezone);
      if (d?.digest_local_time) setLocalTime(d.digest_local_time);
    });
  }, []);

  function persistTheme(next: string) {
    const th = next === "dark" ? "dark" : "light";
    localStorage.setItem("pb_theme", th);
    setTheme(th);
    document.documentElement.dataset.theme = th;
  }
  function persistLocale(next: string) {
    localStorage.setItem("pb_locale", next);
    setLocale(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  }

  async function invite() {
    const res = await fetch(`${API}/api/people/invite`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: "reader" }),
    });
    const data = await res.json();
    setTemp(data.temporary_password || "");
  }
  async function saveWa() {
    await fetch(`${API}/api/people/me/whatsapp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp_e164: wa }),
    });
  }
  async function saveAed() {
    await fetch(`${API}/api/settings/tenant`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ aed_per_delay_day: aed === "" ? null : Number(aed) }),
    });
  }
  async function saveSchedule() {
    await fetch(`${API}/api/settings/tenant`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ digest_timezone: tz, digest_local_time: localTime }),
    });
  }

  function mark(ok: boolean | null) {
    if (ok === true) return "✓";
    if (ok === false) return "—";
    return "?";
  }

  return (
    <AppPage as="article">
      <h1>{t.settings}</h1>
      <div className="sheet">
        <div className="sheet-tabs">
          {(["prefs", "people", "inbound", "meta"] as const).map((id) => (
            <button key={id} type="button" className={`ae-btn ${tab === id ? "" : "ghost"}`} onClick={() => setTab(id)}>
              {id === "prefs" ? t.prefs : id === "people" ? t.people : id === "inbound" ? t.inbound_title : t.meta_title}
            </button>
          ))}
        </div>
        {tab === "prefs" && (
          <div className="grid-2">
            <section className="ae-card interactive">
              <h2>{t.prefs}</h2>
              <div className="dash-actions">
                <button type="button" className="ae-btn ghost" onClick={() => persistTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? t.theme_light : t.theme_dark}</button>
                <button type="button" className="ae-btn ghost" onClick={() => persistLocale(locale === "en" ? "ar" : "en")}>{locale === "ar" ? "EN" : "ع"}</button>
              </div>
            </section>
            <section className="ae-card ae-field interactive">
              <h2>{t.aed_per_day}</h2>
              <p className="muted">{t.exposure_note}</p>
              <input value={aed} onChange={(e) => setAed(e.target.value)} inputMode="decimal" disabled={!canWrite} />
              {canWrite && <button type="button" className="ae-btn" onClick={() => void saveAed()}>{t.set_aed_per_day}</button>}
            </section>
            <section className="ae-card ae-field interactive">
              <h2>{t.digest_schedule}</h2>
              <p className="muted">{t.digest_schedule_note}</p>
              <label htmlFor="digest-tz">{t.digest_timezone}</label>
              <select id="digest-tz" value={tz} disabled={!canWrite} onChange={(e) => setTz(e.target.value)}>
                {["Asia/Dubai", "Asia/Riyadh", "Asia/Kuwait", "Asia/Qatar", "UTC", tz].filter((v, i, a) => a.indexOf(v) === i).map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              <label htmlFor="digest-time">{t.digest_local_time}</label>
              <input id="digest-time" type="time" value={localTime} disabled={!canWrite} onChange={(e) => setLocalTime(e.target.value)} />
              {canWrite && <button type="button" className="ae-btn" onClick={() => void saveSchedule()}>{t.save_schedule}</button>}
            </section>
            <section className="ae-card interactive" style={{ gridColumn: "1 / -1" }}>
              <h2>{t.pilot_checklist}</h2>
              <p className="muted">{t.pilot_checklist_sub}</p>
              {(pilot?.items || []).map((item: { id: string; label: string; ok: boolean | null }) => (
                <p key={item.id} className="ev">{mark(item.ok)} {item.label}</p>
              ))}
            </section>
          </div>
        )}
        {tab === "people" && (
          <section className="ae-card ae-field interactive">
            <h2>{t.people}</h2>
            {people.map((p) => (
              <p key={p.user_id}>{p.email} · {p.role} · {p.whatsapp_e164 || "—"}</p>
            ))}
            {canWrite && (
              <>
                <label htmlFor="invite-email">{t.email}</label>
                <input id="invite-email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button type="button" className="ae-btn" onClick={() => void invite()}>{t.invite_reader}</button>
                {temp && <p className="ask-banner">{t.temp_password}: {temp}</p>}
              </>
            )}
            <p className="sub">{t.whatsapp_best_effort}</p>
            <label htmlFor="wa">{t.save_whatsapp}</label>
            <input id="wa" value={wa} onChange={(e) => setWa(e.target.value)} />
            <button type="button" className="ae-btn ghost" onClick={() => void saveWa()}>{t.save_whatsapp}</button>
          </section>
        )}
        {tab === "inbound" && (
          <section className="ae-card interactive">
            <h2>{t.inbound_title}</h2>
            <p className="muted">{inbound?.note || t.inbound_stub}</p>
            <p className="sub">{t.inbound_test}</p>
            {(inbound?.checklist || []).map((item: { id: string; label: string; ok: boolean }) => (
              <p key={item.id} className="ev">{item.ok ? "✓" : "—"} {item.label}</p>
            ))}
            {(inbound?.forwards || []).map((f: { project: string; forward_address: string }) => (
              <p key={f.forward_address} className="ev">{f.project}: {f.forward_address}</p>
            ))}
            {inbound?.last_inbound && <p className="muted">{inbound.last_inbound.filename} · {inbound.last_inbound.parse_status}</p>}
          </section>
        )}
        {tab === "meta" && (
          <section className="ae-card interactive">
            <h2>{t.meta_title}</h2>
            <p className="muted">{t.meta_manual}</p>
            <ul>
              {META.map((k) => <li key={k}>{t[k]} — {t.meta_unchecked}</li>)}
            </ul>
            <p className="sub">{t.whatsapp_best_effort}</p>
          </section>
        )}
      </div>
    </AppPage>
  );
}
