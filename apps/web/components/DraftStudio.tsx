"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildDemandNotice } from "@loknyaya/engine";
import type { Messages } from "../lib/i18n";
import { sendEvent } from "../lib/track";

interface Props {
  t: Messages;
  ruleKey: string;
  matter: string;
  act: string;
  today: string;
  defaultAmount: string;
}

interface Form {
  senderName: string;
  senderAddress: string;
  recipientName: string;
  recipientAddress: string;
  facts: string;
  relief: string;
  amount: string;
  days: string;
}

export default function DraftStudio({ t, ruleKey, matter, act, today, defaultAmount }: Props) {
  const [form, setForm] = useState<Form>({
    senderName: "",
    senderAddress: "",
    recipientName: "",
    recipientAddress: "",
    facts: "",
    relief: "",
    amount: defaultAmount,
    days: "15"
  });
  const [override, setOverride] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const used = useRef(false);

  function markUsed() {
    if (used.current) return;
    used.current = true;
    sendEvent({ type: "notice", rule: ruleKey });
  }

  const generated = useMemo(
    () =>
      buildDemandNotice({
        ...form,
        matter,
        act,
        date: today,
        amount: Number(form.amount) > 0 ? Number(form.amount) : undefined,
        replyDays: Number(form.days) > 0 ? Number(form.days) : 15
      }),
    [form, matter, act, today]
  );
  const text = override ?? generated;

  function update(key: keyof Form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setOverride(null);
    setCopied(false);
  }

  async function copyText() {
    markUsed();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {}
  }

  const fields: { key: keyof Form; label: string; area?: boolean }[] = [
    { key: "senderName", label: t.yourName },
    { key: "senderAddress", label: t.yourAddress, area: true },
    { key: "recipientName", label: t.theirName },
    { key: "recipientAddress", label: t.theirAddress, area: true },
    { key: "facts", label: t.whatHappened, area: true },
    { key: "relief", label: t.whatYouWant, area: true }
  ];

  return (
    <div className="detail draft">
      <h3>{t.draftTitle}</h3>
      {fields.map((f) => (
        <label className="field" key={f.key}>
          <span>{f.label}</span>
          {f.area ? (
            <textarea rows={3} value={form[f.key]} onChange={(e) => update(f.key, e.target.value)} />
          ) : (
            <input type="text" value={form[f.key]} onChange={(e) => update(f.key, e.target.value)} />
          )}
        </label>
      ))}
      <label className="field">
        <span>{t.replyDays}</span>
        <input type="number" inputMode="numeric" min="1" value={form.days} onChange={(e) => update("days", e.target.value)} />
      </label>
      <label className="field">
        <span>{t.draftTitle}</span>
        <textarea rows={14} value={text} onChange={(e) => setOverride(e.target.value)} />
      </label>
      <div className="actions">
        <button type="button" className="btn" onClick={() => {
            markUsed();
            window.print();
          }}>
          {t.print}
        </button>
        <button type="button" className="btn" onClick={copyText}>
          {copied ? t.copied : t.copy}
        </button>
      </div>
      <p className="hint">{t.draftNote}</p>
      {createPortal(<pre className="printonly">{text}</pre>, document.body)}
    </div>
  );
}
