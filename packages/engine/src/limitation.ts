import { addDays, addMonths, diffDays, isSunday, parseISO, toISO } from "./dates";
import type { ISODate } from "./dates";
import type { LimitationSpec } from "./schema";

export type Status = "safe" | "approaching" | "urgent" | "expired";

export interface Exclusion {
  from: ISODate;
  to: ISODate;
}

export interface LimitationInput {
  start: ISODate;
  today: ISODate;
  exclusions?: Exclusion[];
  acknowledgements?: ISODate[];
  closedDates?: ISODate[];
}

export interface LimitationResult {
  effectiveStart: ISODate;
  deadline: ISODate;
  extendedDeadline: ISODate | null;
  daysRemaining: number;
  status: Status;
  steps: string[];
  recoveryHints: string[];
  appliedAcknowledgement: ISODate | null;
  ignoredAcknowledgements: ISODate[];
  excludedDays: number;
}

export const APPROACHING_DAYS = 60;
export const URGENT_DAYS = 14;

function endOfPeriod(start: Date, spec: LimitationSpec): Date {
  const { amount, unit } = spec.period;
  if (unit === "days") return addDays(start, amount);
  if (unit === "months") return addMonths(start, amount);
  return addMonths(start, amount * 12);
}

function excludedDays(exclusions: Exclusion[], start: Date): number {
  let total = 0;
  for (const e of exclusions) {
    const from = parseISO(e.from);
    const to = parseISO(e.to);
    if (to < from) throw new Error(`Exclusion ends before it starts: ${e.from} to ${e.to}`);
    if (from >= start) total += diffDays(from, to) + 1;
  }
  return total;
}

function deadlineFor(start: Date, spec: LimitationSpec, exclusions: Exclusion[]): Date {
  return addDays(endOfPeriod(start, spec), excludedDays(exclusions, start));
}

function nextOpenDay(date: Date, closed: Set<string>): Date {
  let day = date;
  while (isSunday(day) || closed.has(toISO(day))) day = addDays(day, 1);
  return day;
}

export function computeLimitation(spec: LimitationSpec, input: LimitationInput): LimitationResult {
  const today = parseISO(input.today);
  const exclusions = input.exclusions ?? [];
  const closed = new Set(input.closedDates ?? []);
  const steps: string[] = [];

  let start = parseISO(input.start);
  let deadline = deadlineFor(start, spec, exclusions);
  steps.push(
    `The period is ${spec.period.amount} ${spec.period.unit}, counted from ${toISO(start)} with that day itself left out (${spec.starts}).`
  );

  let appliedAcknowledgement: ISODate | null = null;
  const ignoredAcknowledgements: ISODate[] = [];

  if (spec.acknowledgementExtends) {
    for (const raw of [...(input.acknowledgements ?? [])].sort()) {
      const ack = parseISO(raw);
      if (ack >= start && ack <= deadline) {
        start = ack;
        appliedAcknowledgement = raw;
        deadline = deadlineFor(start, spec, exclusions);
        steps.push(`A written acknowledgement or part payment on ${raw} starts a fresh period.`);
      } else {
        ignoredAcknowledgements.push(raw);
        steps.push(`The acknowledgement on ${raw} falls outside the running period, so it does not extend the deadline.`);
      }
    }
  }

  const excluded = excludedDays(exclusions, start);
  if (excluded > 0) {
    steps.push(`${excluded} days spent in a forum without jurisdiction are left out, which depends on good faith and due diligence.`);
  }

  const open = nextOpenDay(deadline, closed);
  const extended = open.getTime() === deadline.getTime() ? null : open;
  if (extended) {
    steps.push(`The last day, ${toISO(deadline)}, is a closed day. Filing on ${toISO(extended)} may be allowed, but plan to file earlier.`);
  }

  const last = extended ?? deadline;
  const daysRemaining = diffDays(today, deadline);
  let status: Status;
  if (today > last) status = "expired";
  else if (daysRemaining <= URGENT_DAYS) status = "urgent";
  else if (daysRemaining <= APPROACHING_DAYS) status = "approaching";
  else status = "safe";

  const recoveryHints: string[] = [];
  if (status === "expired") {
    if (spec.condonable) {
      recoveryHints.push("A late filing may be accepted in this matter if you show sufficient cause for the delay. Ask a lawyer or the legal services authority.");
    }
    recoveryHints.push("Time spent in a forum that had no jurisdiction may be left out. Write down the dates.");
    if (spec.acknowledgementExtends) {
      recoveryHints.push("A written acknowledgement or part payment made before the deadline can start a fresh period. Look through letters, messages and bank records.");
    }
  }

  return {
    effectiveStart: toISO(start),
    deadline: toISO(deadline),
    extendedDeadline: extended ? toISO(extended) : null,
    daysRemaining,
    status,
    steps,
    recoveryHints,
    appliedAcknowledgement,
    ignoredAcknowledgements,
    excludedDays: excluded
  };
}
