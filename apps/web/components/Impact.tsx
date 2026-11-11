"use client";

import { useEffect, useState } from "react";

type Counters = Record<string, number>;

function count(c: Counters, key: string): number {
  return c[key] ?? 0;
}

export default function Impact() {
  const [counters, setCounters] = useState<Counters | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("stats"))))
      .then((data: { counters: Counters }) => setCounters(data.counters))
      .catch(() => setFailed(true));
  }, []);

  const n = (value: number) => value.toLocaleString("en-IN");
  const tiles = counters
    ? [
        ["Deadline checks", count(counters, "checks")],
        ["Checks with an urgent or expired deadline", count(counters, "status:urgent") + count(counters, "status:expired")],
        ["Legal notices drafted", count(counters, "notices")],
        ["Follow-up answers", count(counters, "followups")],
        ["Resolved without court", count(counters, "outcome:resolved")],
        ["Settled", count(counters, "outcome:settled")],
        ["Cases or complaints filed", count(counters, "outcome:filed")],
        ["Rupees recovered, self-reported", count(counters, "recovered_rupees")],
        ["States and territories reached", Object.keys(counters).filter((k) => k.startsWith("state:")).length]
      ]
    : [];

  return (
    <main className="page narrow">
      <section className="hero">
        <h1>Impact so far</h1>
        <p className="lead">Anonymous counters. Nothing here is linked to a person. Outcomes and rupees are reported by users themselves.</p>
      </section>
      {failed && <p className="notice">The counters appear once the site is deployed with its database.</p>}
      {!counters && !failed && <p className="hint">Loading</p>}
      <div className="tiles">
        {tiles.map(([name, value]) => (
          <div className="tile" key={name}>
            <strong>{n(Number(value))}</strong>
            <span>{name}</span>
          </div>
        ))}
      </div>
      <p className="foot">
        <a href="/">Back to the deadline checker</a>
      </p>
    </main>
  );
}
