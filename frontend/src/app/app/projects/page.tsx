"use client";

import { FormEvent, useEffect, useState } from "react";
import en from "../../../i18n/en.json";
import ar from "../../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Project = { id: string; name: string; code: string; slug: string; forward_address: string };
type Doc = { id: string; filename: string; project_id: string | null; parse_status: string; unassigned: boolean };

function auth() {
  return { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}` };
}

export default function ProjectsPage() {
  const [locale, setLocale] = useState("en");
  const t = ((locale === "ar" ? ar : en) as Record<string, string>);
  const role = typeof window !== "undefined" ? localStorage.getItem("pb_role") || "" : "";
  const canWrite = role === "owner" || role === "ops";
  const [projects, setProjects] = useState<Project[]>([]);
  const [unassigned, setUnassigned] = useState<Doc[]>([]);
  const [quota, setQuota] = useState("");
  const [note, setNote] = useState("");
  const [runOut, setRunOut] = useState("");

  async function load() {
    const [p, d] = await Promise.all([
      fetch(`${API}/api/projects`, { headers: auth() }),
      fetch(`${API}/api/documents?unassigned=1`, { headers: auth() }),
    ]);
    if (p.ok) setProjects(await p.json());
    if (d.ok) setUnassigned(await d.json());
  }
  useEffect(() => {
    setLocale(localStorage.getItem("pb_locale") || "en");
    void load();
  }, []);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuota("");
    const form = new FormData(event.currentTarget);
    const res = await fetch(`${API}/api/projects`, {
      method: "POST",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), code: form.get("code") }),
    });
    if (res.status === 402) {
      setQuota(t.quota_full);
      return;
    }
    if (res.ok) {
      (event.target as HTMLFormElement).reset();
      await load();
    }
  }

  async function upload(projectId: string | null, file: File) {
    const body = new FormData();
    body.append("file", file);
    if (projectId) body.append("project_id", projectId);
    const res = await fetch(`${API}/api/documents`, { method: "POST", headers: auth(), body });
    const data = await res.json();
    setNote(`${data.parse_status || ""} · events ${data.event_count ?? "—"} · ${data.match_method || ""}`);
    await load();
  }

  async function reassign(docId: string, projectId: string) {
    await fetch(`${API}/api/documents/${docId}/reassign`, {
      method: "POST",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId }),
    });
    await load();
  }

  async function run(projectId: string) {
    const res = await fetch(`${API}/api/projects/${projectId}/run`, { method: "POST", headers: auth() });
    const data = await res.json();
    setRunOut(`created: ${(data.created || []).join(", ") || "none"} · dropped: ${(data.dropped || []).join(", ") || "none"}`);
  }

  return (
    <article>
      <h1>{t.projects}</h1>
      <p className="sub">{t.forward_tip}</p>
      {quota && <p className="card">{quota} <a href="/app/billing">{t.billing}</a></p>}
      {note && <p className="muted">{note}</p>}
      {runOut && <p className="muted">{runOut} — <a href="/app">{t.open_digest}</a></p>}
      {projects.length === 0 && (
        <p className="card">{t.empty_projects} <a href="/app/onboarding">{t.onboarding}</a></p>
      )}

      {canWrite && (
        <form className="card" onSubmit={(e) => void createProject(e)}>
          <h2>{t.create_project}</h2>
          <label htmlFor="proj-name">{t.company_name}</label>
          <input id="proj-name" name="name" required />
          <label htmlFor="proj-code">Code</label>
          <input id="proj-code" name="code" required />
          <button type="submit">{t.create_project}</button>
        </form>
      )}

      {canWrite && (
        <div className="card">
          <h2>{t.upload_unassigned}</h2>
          <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(null, f); }} />
        </div>
      )}

      {unassigned.length > 0 && (
        <section>
          <h2 className="dash-sec">{t.unassigned}</h2>
          {unassigned.map((d) => (
            <div key={d.id} className="card">
              <p>{d.filename} · {d.parse_status}</p>
              {canWrite && (
                <select defaultValue="" onChange={(e) => e.target.value && void reassign(d.id, e.target.value)}>
                  <option value="">{t.reassign}</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
            </div>
          ))}
        </section>
      )}

      {projects.map((p) => (
        <section key={p.id} className="dash-card">
          <h2>{p.name} <span className="muted">{p.code}</span></h2>
          <p className="ev">{p.forward_address}</p>
          {canWrite && (
            <>
              <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(p.id, f); }} />
              <p><button type="button" onClick={() => void run(p.id)}>{t.run_agents}</button></p>
            </>
          )}
        </section>
      ))}
    </article>
  );
}
