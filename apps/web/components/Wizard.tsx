"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addMonths, computeLimitation, lawsFor, parseISO, toISO } from "@loknyaya/engine";
import type { LimitationResult } from "@loknyaya/engine";
import { directory, jurisdictions } from "@loknyaya/engine/bundled";
import ResultView from "./ResultView";
import { useLanguage } from "../lib/useLanguage";
import { sendEvent } from "../lib/track";
import { optionsFor, sortedJurisdictions, whereOf } from "../lib/matters";
import type { MatterOption } from "../lib/matters";

const TOTAL = 3;

export default function Wizard() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [stateCode, setStateCode] = useState("");
  const [ruleKey, setRuleKey] = useState("");
  const [query, setQuery] = useState("");
  const [start, setStart] = useState("");
  const [today, setToday] = useState("");
  const [value, setValue] = useState("");
  const [ack, setAck] = useState("");
  const [wrongFrom, setWrongFrom] = useState("");
  const [wrongTo, setWrongTo] = useState("");
  const [lastGood, setLastGood] = useState<LimitationResult | null>(null);
  const sent = useRef(new Set<string>());

  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-CA"));
    try {
      const saved = window.localStorage.getItem("loknyaya.state");
      if (saved && jurisdictions.some((j) => j.code === saved)) setStateCode(saved);
    } catch {}
  }, []);

  const options = useMemo(() => optionsFor(stateCode), [stateCode]);
  const selected = options.find((o) => o.key === ruleKey);

  const outcome = useMemo(() => {
    if (!selected || !start || !today) return null;
    try {
      const result = computeLimitation(selected.rule.limitation, {
        start,
        today,
        acknowledgements: ack ? [ack] : [],
        exclusions: wrongFrom && wrongTo ? [{ from: wrongFrom, to: wrongTo }] : []
      });
      return { result, failed: false };
    } catch {
      return { result: null as LimitationResult | null, failed: true };
    }
  }, [selected, start, today, ack, wrongFrom, wrongTo]);

  useEffect(() => {
    if (outcome?.result) setLastGood(outcome.result);
  }, [outcome]);

  const status = outcome?.result?.status;
  useEffect(() => {
    if (!showResult || !status || !ruleKey) return;
    const marker = `${ruleKey}|${status}`;
    if (sent.current.has(marker)) return;
    sent.current.add(marker);
    sendEvent({ type: "check", rule: ruleKey, status, ...(stateCode ? { state: stateCode } : {}) });
  }, [showResult, status, ruleKey, stateCode]);

  function chooseState(code: string) {
    setStateCode(code);
    setRuleKey("");
    setShowResult(false);
    try {
      window.localStorage.setItem("loknyaya.state", code);
    } catch {}
  }

  function goTo(index: number) {
    setShowResult(false);
    setStep(index);
  }

  function pickDate(date: string) {
    setStart(date);
    if (date) setShowResult(true);
  }

  function restart() {
    setShowResult(false);
    setRuleKey("");
    setStart("");
    setValue("");
    setAck("");
    setWrongFrom("");
    setWrongTo("");
    setLastGood(null);
    setQuery("");
    setStep(1);
  }

  const needle = query.trim().toLowerCase();
  const visible = needle ? options.filter((o) => `${o.rule.label} ${o.pack.title}`.toLowerCase().includes(needle)) : options;
  const localItems = visible.filter((o) => o.pack.layer !== "central");
  const centralItems = visible.filter((o) => o.pack.layer === "central");
  const hasLocalPacks = options.some((o) => o.pack.layer !== "central");
  const stateName = sortedJurisdictions.find((j) => j.code === stateCode)?.name ?? "";
  const localLevel = localItems[0]?.pack.layer === "ut" ? "ut" : "state";
  const groups: { id: string; title: string; body: string; items: MatterOption[] }[] = [
    { id: "local", title: t.lawLevelLabel(localLevel, stateName), body: t.lawStateBody, items: localItems },
    { id: "central", title: t.lawCentral, body: t.lawCentralBody, items: centralItems }
  ].filter((g) => g.items.length > 0);
  const quick: [string, number][] = [
    [t.quickMonth, -1],
    [t.quick6, -6],
    [t.quick1y, -12],
    [t.quick2y, -24],
    [t.quick3y, -36]
  ];
  const labels = [t.stepWhere, t.stepWhat, t.stepWhen];
  const reached = (i: number) => showResult || i <= 1 || (i === 2 && Boolean(selected));
  const result = outcome?.result ?? lastGood;

  return (
    <section className="wizard" id="start" aria-label={t.ctaStart}>
      <ol className="steps">
        {labels.map((label, i) => {
          const done = showResult || i < step;
          const on = !showResult && i === step;
          return (
            <li key={label} className={on ? "on" : done ? "done" : ""}>
              <button type="button" disabled={!reached(i)} onClick={() => goTo(i)} aria-current={on ? "step" : undefined}>
                <span className="num">{i + 1}</span>
                <span className="lbl">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="stage" key={showResult ? "result" : step}>
        {showResult && selected && result && start && (
          <ResultView
            option={selected}
            result={result}
            failed={Boolean(outcome?.failed)}
            today={today}
            stateCode={stateCode}
            start={start}
            setStart={setStart}
            value={value}
            setValue={setValue}
            ack={ack}
            setAck={setAck}
            wrongFrom={wrongFrom}
            setWrongFrom={setWrongFrom}
            wrongTo={wrongTo}
            setWrongTo={setWrongTo}
            onEdit={goTo}
            onRestart={restart}
          />
        )}

        {!showResult && step === 0 && (
          <div>
            <p className="eyebrow">{t.stepOf(1, TOTAL)}</p>
            <h2>{t.stepWhere}</h2>
            <p className="hint">{t.step1Hint}</p>
            <div className="quickstates">
              {Object.keys(directory).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={stateCode === code ? "pill on" : "pill"}
                  onClick={() => {
                    chooseState(code);
                    setStep(1);
                  }}
                >
                  {sortedJurisdictions.find((j) => j.code === code)?.name}
                </button>
              ))}
            </div>
            <label className="field">
              <span className="sr">{t.stepWhere}</span>
              <select value={stateCode} onChange={(e) => chooseState(e.target.value)}>
                <option value="">{t.anywhere}</option>
                {sortedJurisdictions.map((j) => (
                  <option key={j.code} value={j.code}>
                    {j.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="nav">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                {t.skip}
              </button>
              <button type="button" className="btn btn-violet" disabled={!stateCode} onClick={() => setStep(1)}>
                {t.goNext}
              </button>
            </div>
          </div>
        )}

        {!showResult && step === 1 && (
          <div>
            <p className="eyebrow">{t.stepOf(2, TOTAL)}</p>
            <h2>{t.stepWhat}</h2>
            {stateCode && !hasLocalPacks && <p className="notice">{t.noStateRules(stateName)}</p>}
            <label className="field">
              <span className="sr">{t.searchMatters}</span>
              <input type="search" placeholder={t.searchMatters} value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <div className="choices">
              {groups.map((group) => (
                <div className="group" key={group.id}>
                  <h3 className="group-title">{group.title}</h3>
                  <p className="hint">{group.body}</p>
                  {group.items.map((o) => {
                    const lead = lawsFor(o.pack, o.rule)[0];
                    return (
                      <button
                        key={o.key}
                        type="button"
                        className={o.key === ruleKey ? "choice on" : "choice"}
                        onClick={() => {
                          setRuleKey(o.key);
                          setStep(2);
                        }}
                      >
                        <strong>{o.rule.label}</strong>
                        <span>{o.pack.title}</span>
                        {lead && (
                          <span className="choice-law">
                            <em>{lead.name}</em>
                            <b className={lead.level === "central" ? "badge central small" : "badge local small"}>
                              {t.lawLevelLabel(lead.level, whereOf(lead.jurisdictions))}
                            </b>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
              {groups.length === 0 && <p className="hint">{t.noMatters}</p>}
            </div>
            <div className="nav">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>
                {t.goBack}
              </button>
            </div>
          </div>
        )}

        {!showResult && step === 2 && (
          <div>
            <p className="eyebrow">{t.stepOf(3, TOTAL)}</p>
            <h2>{t.stepWhen}</h2>
            {selected && (
              <p className="hint">
                {t.countFrom}: {selected.rule.limitation.starts}
              </p>
            )}
            <div className="quickdates">
              {today &&
                quick.map(([label, months]) => {
                  const date = toISO(addMonths(parseISO(today), months));
                  return (
                    <button key={label} type="button" className={start === date ? "pill on" : "pill"} onClick={() => pickDate(date)}>
                      {label}
                    </button>
                  );
                })}
            </div>
            <label className="field">
              <span>{t.orPick}</span>
              <input type="date" value={start} max={today || undefined} onChange={(e) => setStart(e.target.value)} />
            </label>
            <div className="nav">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                {t.goBack}
              </button>
              <button type="button" className="btn btn-orange" disabled={!start || !selected} onClick={() => setShowResult(true)}>
                {t.seeDeadline}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
