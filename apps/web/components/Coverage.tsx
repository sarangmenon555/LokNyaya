"use client";

import { directory, jurisdictions, registry } from "@loknyaya/engine/bundled";

function statusOf(code: string): string {
  const own = registry.packs.filter((p) => p.jurisdictions.includes(code));
  if (own.length === 0) return "Central rules only";
  return own.every((p) => p.verification.status === "verified") ? "Verified" : "Awaiting expert review";
}

export default function Coverage() {
  const rows = [...jurisdictions].sort((a, b) => a.name.localeCompare(b.name));
  const central = registry.packs.filter((p) => p.layer === "central");
  const state = registry.packs.filter((p) => p.layer !== "central");
  const verified = registry.packs.filter((p) => p.verification.status === "verified");

  return (
    <main className="page narrow">
      <section className="hero">
        <h1>What is covered</h1>
        <p className="lead">
          Central rules apply in every state and union territory. State rules are added only when written down from the official text, and are marked until a legal reviewer signs them off.
        </p>
      </section>
      <div className="tiles">
        <div className="tile">
          <strong>{central.length}</strong>
          <span>Central rule packs</span>
        </div>
        <div className="tile">
          <strong>{state.length}</strong>
          <span>State rule packs</span>
        </div>
        <div className="tile">
          <strong>{verified.length}</strong>
          <span>Signed off by a reviewer</span>
        </div>
        <div className="tile">
          <strong>{Object.keys(directory).length}</strong>
          <span>States with a full help directory</span>
        </div>
      </div>
      <div className="stack" style={{ marginTop: "1.5rem" }}>
        {rows.map((j) => (
          <div className="tile" key={j.code}>
            <strong style={{ fontSize: "1.1rem" }}>{j.name}</strong>
            <span>
              {statusOf(j.code)}
              {directory[j.code] ? ", full help directory" : ", legal services authority only"}
            </span>
          </div>
        ))}
      </div>
      <p className="foot">
        <a href="/">Back to the deadline checker</a>
      </p>
    </main>
  );
}
