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

function RiskCard({ card }: { card: Card }) {
  return (
    <article className={`card ${card.severity}`}>
      <div className="sev">{card.severity.toUpperCase()} · {card.project_name}</div>
      <h3>{card.title}</h3>
      <p className="why">{card.why_it_hits_us}</p>
      <p className="ev">{card.evidence_snippet} · {card.evidence_pointer}</p>
      <p className="conf">Confidence {Math.round(card.confidence * 100)}%</p>
    </article>
  );
}

export default async function HomePage() {
  let digest: Digest | null = null;
  try {
    const res = await fetch(`${API}/api/digest/today`, { cache: "no-store" });
    if (res.ok) digest = await res.json();
  } catch {
    digest = null;
  }

  return (
    <>
      <h1>Today’s digest</h1>
      <p className="sub">
        {digest?.channel_promise || "Morning briefing by email."}{" "}
        What threatens cash, crew, or margin this week.
      </p>
      {!digest && (
        <div className="card">
          API is not connected yet. Start the backend, then refresh. No fake risks are shown.
        </div>
      )}
      {digest && digest.act.length === 0 && digest.watch.length === 0 && (
        <div className="card">No files scored yet. Upload a schedule, IPC, or variation email.</div>
      )}
      {digest?.act.map((c) => <RiskCard key={c.id} card={c} />)}
      {digest?.watch.map((c) => <RiskCard key={c.id} card={c} />)}
      {digest && digest.quiet_projects.length > 0 && (
        <p className="muted">Quiet: {digest.quiet_projects.join(", ")}</p>
      )}
      {digest?.ask && <p className="sub">{digest.ask}</p>}
    </>
  );
}
