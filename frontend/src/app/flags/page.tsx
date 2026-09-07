"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type FlagRow = {
  id: string;
  title: string;
  note: string;
  project_name: string;
  created_at: string | null;
  share_url: string | null;
  share_revoked: boolean;
};

function token() {
  return typeof window === "undefined" ? "" : localStorage.getItem("pb_token") || "";
}

export default function FlagsPage() {
  const [rows, setRows] = useState<FlagRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`${API}/api/flags`, { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) {
      setError("Could not load flags.");
      return;
    }
    setRows(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function revoke(id: string) {
    await fetch(`${API}/api/flags/${id}/revoke-share`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
    void load();
  }

  return (
    <>
      <h1>Open flags</h1>
      <p className="sub">Items marked “this affects us.” Share is a secret link — revoke anytime.</p>
      {error && <div className="card">{error}</div>}
      {rows.length === 0 && <div className="card">No open flags.</div>}
      {rows.map((row) => (
        <article className="card" key={row.id}>
          <div className="sev">{row.project_name}</div>
          <h3>{row.title}</h3>
          <p className="why">{row.note}</p>
          {row.share_url && (
            <p>
              <a href={row.share_url}>Share link</a>{" "}
              <button type="button" onClick={() => void revoke(row.id)}>Revoke</button>
            </p>
          )}
        </article>
      ))}
    </>
  );
}
