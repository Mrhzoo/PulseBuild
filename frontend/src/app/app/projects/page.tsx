"use client";

import { FormEvent, useEffect, useState } from "react";
import en from "../../../i18n/en.json";
import ar from "../../../i18n/ar.json";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Project = { id: string; name: string; code: string; slug: string; forward_address: string };
type Doc = { id: string; filename: string; project_id: string | null; parse_status: string; unassigned: boolean; coach?: string };

function auth() {
  return { Authorization: `Bearer ${localStorage.getItem("pb_token") || ""}` };
}

function DocRow({ d, canWrite, projects, t, onReassign, onTicket }: { d: Doc; canWrite: boolean; projects: Project[]; t: Record<string, string>; onReassign: (id: string, pid: string) => void; onTicket: (id: string) => void }) {
  const bad = d.parse_status === "needs_ocr" || d.parse_status === "needs_better_file";
  return (
    <div className="card">
      <p>{d.filename} · {d.parse_status}</p>
      {d.coach && <p className={bad ? "ask-banner" : "muted"}>{d.coach}</p>}
      {canWrite && d.unassigned && (
        <select defaultValue="" onChange={(e) => e.target.value && onReassign(d.id, e.target.value)}>
          <option value="">{t.reassign}</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
      {canWrite && bad && <p><button type="button" onClick={() => onTicket(d.id)}>{t.ocr_ticket}</button></p>}
    </div>
  );
}

export default function ProjectsPage() {
  const [locale, setLocale] = useState("en");
  const t = ((locale === "ar" ? ar : en) as Record<string, string>);
  const role = typeof window !== "undefined" ? localStorage.getItem("pb_role") || "" : "";
  const canWrite = role === "owner" || role === "ops";
  const [projects, setProjects] = useState<Project[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [quota, setQuota] = useState("");
  const [note, setNote] = useState("");
  const [runOut, setRunOut] = useState("");

  async function load() {
    const [p, d] = await Promise.all([
      fetch(`${API}/api/projects`, { headers: auth() }),
      fetch(`${API}/api/documents`, { headers: auth() }),
    ]);
    if (p.ok) setProjects(await p.json());
    if (d.ok) setDocs(await d.json());
  }
  useEffect(() => {
    setLocale(localStorage.getItem("pb_locale") || "en");
    void load();
  }, []);

  function summarizeRun(data: { created?: string[]; updated?: string[]; dropped?: string[] } | null | undefined) {
    if (!data) return;
    const created = data.created || [];
    const updated = data.updated || [];
    const dropped = data.dropped || [];
    if (!created.length && !updated.length) setRunOut(t.no_new_findings);
    else setRunOut(`${t.run_agents}: +${created.length} / ~${updated.length} / drop ${dropped.length}`);
  }

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
    setNote(data.coach || `${data.parse_status || ""} · events ${data.event_count ?? "—"}`);
    summarizeRun(data.agents_run);
    await load();
  }

  async function reassign(docId: string, projectId: string) {
    const res = await fetch(`${API}/api/documents/${docId}/reassign`, {
      method: "POST",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId }),
    });
    const data = await res.json().catch(() => ({}));
    summarizeRun(data.agents_run);
    await load();
  }

  async function ticket(docId: string) {
    await fetch(`${API}/api/documents/${docId}/ocr-ticket`, {
      method: "POST",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ ticket: `OCR-${docId.slice(0, 8)}` }),
    });
    setNote(t.ocr_ticket_ok);
  }

  async function run(projectId: string) {
    const res = await fetch(`${API}/api/projects/${projectId}/run`, { method: "POST", headers: auth() });
    const data = await res.json();
    summarizeRun(data);
  }

  const unassigned = docs.filter((d) => d.unassigned);

  return (
    <article>
      <h1>{t.projects}</h1>
      <p className="sub">{t.forward_tip}</p>
      {quota && <p className="card">{quota} <a href="/app/billing">{t.billing}</a></p>}
      {note && <p className="muted">{note}</p>}
      {runOut && <p className="ask-banner">{runOut} — <a href="/app">{t.open_digest}</a></p>}
      {projects.length === 0 && (
        <p className="card">{t.empty_projects} <a href="/app/onboarding">{t.onboarding}</a></p>
      )}

      {canWrite && (
        <form className="card" onSubmit={(e) => void createProject(e)}>
          <h2>{t.create_project}</h2>
          <label htmlFor="proj-name">{t.company_name}</label>
          <input id="proj-name" name="name" required />
          <label htmlFor="proj-code">{t.project_code}</label>
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
            <DocRow key={d.id} d={d} canWrite={canWrite} projects={projects} t={t} onReassign={reassign} onTicket={(id) => void ticket(id)} />
          ))}
        </section>
      )}

      {projects.map((p) => (
        <section key={p.id} className="dash-card">
          <h2>{p.name} <span className="muted">{p.code}</span></h2>
          <p className="ev">{p.forward_address}</p>
          {docs.filter((d) => d.project_id === p.id).map((d) => (
            <DocRow key={d.id} d={d} canWrite={canWrite} projects={projects} t={t} onReassign={reassign} onTicket={(id) => void ticket(id)} />
          ))}
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
