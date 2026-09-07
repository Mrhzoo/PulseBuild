const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Share = {
  title: string;
  why_it_hits_us: string;
  evidence_snippet: string;
  evidence_pointer: string;
  confidence: number;
  project_name: string;
  flagged_at: string | null;
  note: string;
  company: string;
  severity: string;
};

export default async function SharePage({ params }: { params: { token: string } }) {
  let card: Share | null = null;
  let missing = false;
  try {
    const res = await fetch(`${API}/api/share/${params.token}`, { cache: "no-store" });
    if (res.ok) card = await res.json();
    else missing = true;
  } catch {
    missing = true;
  }

  if (missing || !card) {
    return (
      <>
        <h1>Link unavailable</h1>
        <p className="sub">This share was revoked or never existed. No extra project data is shown.</p>
        <p className="muted">Shared from PulseBuild</p>
      </>
    );
  }

  return (
    <>
      <p className="muted">{card.company}</p>
      <h1>{card.title}</h1>
      <p className="sub">{card.severity.toUpperCase()} · {card.project_name} · {Math.round(card.confidence * 100)}%</p>
      <article className={`card ${card.severity}`}>
        <p className="why">{card.why_it_hits_us}</p>
        <p className="ev">{card.evidence_snippet} · {card.evidence_pointer}</p>
        {card.note && <p>Note: {card.note}</p>}
      </article>
      <p className="muted">Shared from PulseBuild · proof link, not a live portal.</p>
    </>
  );
}
