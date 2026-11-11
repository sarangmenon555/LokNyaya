"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { addDays, diffDays, lawsFor, parseISO, routeForums, toISO } from "@loknyaya/engine";
import type { LimitationResult } from "@loknyaya/engine";
import { directory, jurisdictions } from "@loknyaya/engine/bundled";
import ClockRing from "./ClockRing";
import DraftStudio from "./DraftStudio";
import { useLanguage } from "../lib/useLanguage";
import { useCountUp } from "../lib/useCountUp";
import { buildIcs, canSpeak, download, formatDate, speak } from "../lib/helpers";
import { whereOf } from "../lib/matters";
import type { MatterOption } from "../lib/matters";
import type { Messages } from "../lib/i18n";

type Tab = "steps" | "where" | "docs" | "draft" | "how";

interface Props {
  option: MatterOption;
  result: LimitationResult;
  failed: boolean;
  today: string;
  stateCode: string;
  start: string;
  setStart: (v: string) => void;
  value: string;
  setValue: (v: string) => void;
  ack: string;
  setAck: (v: string) => void;
  wrongFrom: string;
  setWrongFrom: (v: string) => void;
  wrongTo: string;
  setWrongTo: (v: string) => void;
  onEdit: (step: number) => void;
  onRestart: () => void;
}

function statusText(t: Messages, status: LimitationResult["status"]): string {
  if (status === "safe") return t.statusSafe;
  if (status === "approaching") return t.statusApproaching;
  if (status === "urgent") return t.statusUrgent;
  return t.statusExpired;
}

export default function ResultView(p: Props) {
  const { t, locale } = useLanguage();
  const { option, result } = p;
  const [tab, setTab] = useState<Tab>("steps");
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [speech, setSpeech] = useState(false);

  useEffect(() => setSpeech(canSpeak()), []);
  useEffect(() => {
    setTicked(new Set());
    setTab("steps");
  }, [option.key]);

  const days = Math.abs(result.daysRemaining);
  const shownDays = useCountUp(days);
  const total = Math.max(1, diffDays(parseISO(result.effectiveStart), parseISO(result.deadline)));
  const fraction = Math.max(0, result.daysRemaining) / total;
  const line = result.daysRemaining === 0 ? t.bannerToday : result.daysRemaining > 0 ? t.bannerLeft(days) : t.bannerPast(days);
  const caption = result.daysRemaining >= 0 ? t.daysLeft : t.daysAgo;
  const amount = Number(p.value);
  const forums = routeForums(option.rule.forums, amount > 0 ? amount : undefined);
  const showValue = option.rule.forums.some((f) => f.maxInclusive !== null);
  const entry = p.stateCode ? directory[p.stateCode] : undefined;
  const stateName = jurisdictions.find((j) => j.code === p.stateCode)?.name ?? "";
  const docs = option.rule.documents;
  const spec = option.rule.limitation;
  const deadlineText = formatDate(result.deadline, locale);
  const laws = lawsFor(option.pack, option.rule);
  const lead = laws[0];
  const others = laws.slice(1);
  const levelText = (law: { level: "central" | "state" | "ut"; jurisdictions: string[] }) => t.lawLevelLabel(law.level, whereOf(law.jurisdictions));
  const pending = option.pack.verification.status === "pending";
  const pillLabel = stateName || t.stepWhere;

  const steps: string[] = [
    t.stepPeriod(spec.period.amount, t.unitName(spec.period.unit, spec.period.amount), formatDate(p.start, locale))
  ];
  if (result.appliedAcknowledgement) steps.push(t.stepAck(formatDate(result.appliedAcknowledgement, locale)));
  for (const raw of result.ignoredAcknowledgements) steps.push(t.stepIgnoredAck(formatDate(raw, locale)));
  if (result.excludedDays > 0) steps.push(t.stepExcluded(result.excludedDays));
  if (result.extendedDeadline) steps.push(t.stepClosed(deadlineText, formatDate(result.extendedDeadline, locale)));

  const hints: string[] = [];
  if (result.status === "expired") {
    if (spec.condonable) hints.push(t.hintCondone);
    hints.push(t.hintWrongForum);
    if (spec.acknowledgementExtends) hints.push(t.hintAck);
  }

  function addToCalendar() {
    const link = `${window.location.origin}/followup`;
    const events = [
      { date: result.deadline, title: `LokNyaya: ${option.rule.label}`, alarmDays: 7 },
      ...[7, 14, 30].map((n) => ({ date: toISO(addDays(parseISO(p.today), n)), title: t.followupEvent, description: link, alarmDays: 0 }))
    ];
    download("loknyaya-deadline.ics", buildIcs(events), "text/calendar");
  }

  function readAloud() {
    speak(`${statusText(t, result.status)}. ${t.deadline}: ${deadlineText}. ${line}`, locale);
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(t.summaryText(option.rule.label, deadlineText, line));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function shareWhatsApp() {
    const text = `${t.summaryText(option.rule.label, deadlineText, line)} ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  function toggle(doc: string) {
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(doc)) next.delete(doc);
      else next.add(doc);
      return next;
    });
  }

  const todos: { id: string; text: string; run: () => void }[] = [];
  if (docs.length > 0) todos.push({ id: "docs", text: t.stepDocs(docs.length), run: () => setTab("docs") });
  if (option.rule.draft) todos.push({ id: "notice", text: t.stepNotice, run: () => setTab("draft") });
  const firstForum = forums[0];
  if (firstForum) todos.push({ id: "file", text: t.stepFile(firstForum.name, deadlineText), run: () => setTab("where") });
  todos.push({ id: "remind", text: t.stepRemind, run: addToCalendar });

  const tabs: { id: Tab; label: string }[] = [{ id: "steps", label: t.tabSteps }, { id: "where", label: t.tabWhere }];
  if (docs.length > 0) tabs.push({ id: "docs", label: t.tabDocs });
  if (option.rule.draft) tabs.push({ id: "draft", label: t.tabDraft });
  tabs.push({ id: "how", label: t.tabHow });

  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((x) => x.id === tab);
    if (event.key === "ArrowRight") setTab(tabs[(index + 1) % tabs.length]?.id ?? tab);
    if (event.key === "ArrowLeft") setTab(tabs[(index - 1 + tabs.length) % tabs.length]?.id ?? tab);
  }

  return (
    <div className="result">
      <div className="summary" aria-label={t.changeAnswers}>
        <button type="button" className="pill" onClick={() => p.onEdit(0)}>
          {pillLabel}
        </button>
        <button type="button" className="pill" onClick={() => p.onEdit(1)}>
          {option.rule.label}
        </button>
        <button type="button" className="pill" onClick={() => p.onEdit(2)}>
          {formatDate(p.start, locale)}
        </button>
      </div>

      <section className={`verdict s-${result.status}`} aria-live="polite">
        <div className="law-head">
          <p className="law-label">{t.governingLaw}</p>
          {lead && (
            <>
              <div className="law-main">
                <span className="law-title">{lead.name}</span>
                <span className={lead.level === "central" ? "badge central" : "badge local"}>{levelText(lead)}</span>
              </div>
              {lead.setsDeadline && <p className="law-sub">{lead.provision ? t.setsDeadline(lead.provision) : t.setsDeadlineNoProv}</p>}
            </>
          )}
          {others.length > 0 && (
            <div className="law-others">
              <span className="law-label">{t.otherLaws}</span>
              <ul>
                {others.map((law) => (
                  <li key={law.name}>
                    <strong>{law.name}</strong>
                    <span className={law.level === "central" ? "badge central small" : "badge local small"}>{levelText(law)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className={pending ? "review pending" : "review done"}>
            <span className="review-badge">{pending ? t.reviewBadge : t.reviewedBadge}</span>
            {pending && <span className="review-text">{t.needsReview}</span>}
          </p>
        </div>
        <ClockRing fraction={fraction} label={String(shownDays)} caption={caption} status={result.status} />
        <div className="verdict-body">
          <span className="chip">{statusText(t, result.status)}</span>
          <p className="verdict-label">{t.deadline}</p>
          <p className="verdict-date">{deadlineText}</p>
          <p className="verdict-line">{line}</p>
          <p className="verdict-note">{t.checkedOn(formatDate(p.today, locale))}</p>
          {result.extendedDeadline && (
            <p className="verdict-note">
              {t.extended} {formatDate(result.extendedDeadline, locale)}
            </p>
          )}
        </div>
      </section>

      <div className="actions">
        <button type="button" className="btn btn-orange" onClick={addToCalendar}>
          {t.calendar}
        </button>
        {speech && (
          <button type="button" className="btn btn-ghost" onClick={readAloud}>
            {t.listen}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={copySummary}>
          {copied ? t.summaryCopied : t.copySummary}
        </button>
        <button type="button" className="btn btn-ghost" onClick={shareWhatsApp}>
          {t.shareWhatsApp}
        </button>
        <button type="button" className="btn btn-ghost" onClick={p.onRestart}>
          {t.startOver}
        </button>
      </div>

      {p.failed && <p className="notice warn">{t.checkDates}</p>}

      <details className="adjust">
        <summary>{t.adjustTitle}</summary>
        <div className="adjust-grid">
          <label className="field">
            <span>{t.stepWhen}</span>
            <input type="date" value={p.start} max={p.today || undefined} onChange={(e) => p.setStart(e.target.value)} />
          </label>
          {showValue && (
            <label className="field">
              <span>{t.stepValue}</span>
              <input type="number" inputMode="numeric" min="0" value={p.value} onChange={(e) => p.setValue(e.target.value)} />
            </label>
          )}
          <label className="field">
            <span>{t.ackDate}</span>
            <input type="date" value={p.ack} onChange={(e) => p.setAck(e.target.value)} />
          </label>
          <label className="field">
            <span>{t.wrongFrom}</span>
            <input type="date" value={p.wrongFrom} onChange={(e) => p.setWrongFrom(e.target.value)} />
          </label>
          <label className="field">
            <span>{t.wrongTo}</span>
            <input type="date" value={p.wrongTo} onChange={(e) => p.setWrongTo(e.target.value)} />
          </label>
        </div>
      </details>

      <div className="tabs" role="tablist" aria-label={t.nextStepsTitle} onKeyDown={onTabKey}>
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            id={`tab-${x.id}`}
            aria-selected={tab === x.id}
            aria-controls={`panel-${x.id}`}
            tabIndex={tab === x.id ? 0 : -1}
            className="tab"
            onClick={() => setTab(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="panel" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} key={tab}>
        {tab === "steps" && (
          <>
            <h3>{t.nextStepsTitle}</h3>
            <ol className="todos">
              {todos.map((todo, i) => (
                <li key={todo.id}>
                  <button type="button" className="todo" onClick={todo.run}>
                    <span className="todo-num">{i + 1}</span>
                    <span className="todo-text">{todo.text}</span>
                    <span className="todo-go">{t.openIt}</span>
                  </button>
                </li>
              ))}
            </ol>
            {hints.length > 0 && (
              <ul className="hints">
                {hints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "where" && (
          <>
            <h3>{t.where}</h3>
            <div className="infos">
              {forums.map((f) => (
                <div className="info" key={f.id}>
                  <strong>{f.name}</strong>
                  {f.notes && <span>{f.notes}</span>}
                </div>
              ))}
            </div>
            {p.stateCode && (
              <>
                <h3>{t.helpTitle}</h3>
                <div className="infos">
                  <div className="info">
                    <strong>{entry?.legalServices ?? t.genericLegal(stateName)}</strong>
                    <span>{t.helpLegal}</span>
                  </div>
                  {entry && (
                    <>
                      <div className="info">
                        <strong>{entry.consumerCommission}</strong>
                        <span>{t.helpConsumer}</span>
                      </div>
                      <div className="info">
                        <strong>{entry.rera}</strong>
                        <span>{t.helpRera}</span>
                      </div>
                      <div className="info">
                        <strong>{entry.highCourt}</strong>
                        <span>{t.helpCourt}</span>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {tab === "docs" && (
          <>
            <h3>{t.documents}</h3>
            <p className="progress-label">{t.docsProgress(ticked.size, docs.length)}</p>
            <div className="bar" aria-hidden="true">
              <span style={{ width: `${(ticked.size / docs.length) * 100}%` }} />
            </div>
            <ul className="checks">
              {docs.map((doc) => (
                <li key={doc}>
                  <label className={ticked.has(doc) ? "check on" : "check"}>
                    <input type="checkbox" checked={ticked.has(doc)} onChange={() => toggle(doc)} />
                    <span>{doc}</span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === "draft" && option.rule.draft && (
          <DraftStudio
            t={t}
            ruleKey={option.key}
            matter={option.rule.label}
            act={option.pack.acts[0] ?? ""}
            today={formatDate(p.today, "en-IN")}
            defaultAmount={p.value}
          />
        )}

        {tab === "how" && (
          <>
            <h3>{t.howCounted}</h3>
            <ol className="how-list">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="hint">
              {t.countFrom}: {spec.starts}
            </p>
            <p className="hint">{spec.source}</p>
          </>
        )}
      </div>
    </div>
  );
}
