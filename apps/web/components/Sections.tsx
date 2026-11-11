"use client";

import { useState } from "react";
import { findSections } from "@loknyaya/engine";
import { concordance } from "@loknyaya/engine/bundled";

export default function Sections() {
  const [query, setQuery] = useState("");
  const finder = concordance.entries.filter((e) => e.finder);
  const results = query.trim() ? findSections(finder, query) : [];

  return (
    <main className="page narrow">
      <section className="hero">
        <h1>Old to new section numbers</h1>
        <p className="lead">Type an old number such as 420 or 65B, a new number, or a topic word.</p>
      </section>
      <section className="card">
        <label className="field">
          <span>Section or topic</span>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
        </label>
        <div aria-live="polite" className="stack">
          {results.map((e) => (
            <div className="tile" key={e.id}>
              <strong style={{ fontSize: "1.2rem" }}>
                {e.oldCode ? `${e.oldCode} ${e.oldSections.join(", ")} is now ` : ""}
                {e.newCode} {e.newSections[0]}
                {e.newSections.length > 1 && e.newSections[e.newSections.length - 1] !== e.newSections[0] && e.newSections.length > 2
                  ? ` to ${e.newSections[e.newSections.length - 1]}`
                  : ""}
              </strong>
              <span>
                {e.topic}
                {e.note ? `. ${e.note}` : ""}
              </span>
            </div>
          ))}
          {query.trim() && results.length === 0 && <p className="hint">No match in the sections listed here.</p>}
        </div>
        <p className="hint">
          Civil disputes only, and only the sections listed here. Checked by the {concordance.checkedBy} on {concordance.checkedOn}, not yet by an independent lawyer. This is legal information, not legal advice.
        </p>
      </section>
      <p className="foot">
        <a href="/">Back to the deadline checker</a>
      </p>
    </main>
  );
}
