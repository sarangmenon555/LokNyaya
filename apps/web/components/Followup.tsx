"use client";

import { useEffect, useState } from "react";
import { OUTCOMES } from "@loknyaya/engine";
import { useLanguage } from "../lib/useLanguage";
import { sendEvent } from "../lib/track";
import type { Messages } from "../lib/i18n";

type Outcome = (typeof OUTCOMES)[number];

function label(t: Messages, outcome: Outcome): string {
  if (outcome === "resolved") return t.outcomeResolved;
  if (outcome === "settled") return t.outcomeSettled;
  if (outcome === "filed") return t.outcomeFiled;
  if (outcome === "waiting") return t.outcomeWaiting;
  return t.outcomeNothing;
}

export default function Followup() {
  const { t } = useLanguage();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [recovered, setRecovered] = useState("");
  const [state, setState] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      setState(window.localStorage.getItem("loknyaya.state") ?? "");
    } catch {}
  }, []);

  function submit() {
    if (!outcome) return;
    const amount = Math.floor(Number(recovered));
    sendEvent({
      type: "followup",
      outcome,
      ...(amount > 0 ? { recovered: amount } : {}),
      ...(state ? { state } : {})
    });
    setSent(true);
  }

  return (
    <main className="page narrow">
      <section className="card">
        <h1>{t.followupTitle}</h1>
        <p className="lead">{t.followupIntro}</p>
        {sent ? (
          <p className="notice">{t.thanks}</p>
        ) : (
          <>
            <div className="stack" role="radiogroup" aria-label={t.followupTitle}>
              {OUTCOMES.map((o) => (
                <button key={o} type="button" role="radio" aria-checked={outcome === o} className="lang" onClick={() => setOutcome(o)}>
                  {label(t, o)}
                </button>
              ))}
            </div>
            <label className="field">
              <span>{t.recoveredLabel}</span>
              <input type="number" inputMode="numeric" min="0" value={recovered} onChange={(e) => setRecovered(e.target.value)} />
            </label>
            <button type="button" className="btn" disabled={!outcome} onClick={submit}>
              {t.send}
            </button>
          </>
        )}
      </section>
      <p className="foot">
        <a href="/">{t.backHome}</a>
      </p>
    </main>
  );
}
