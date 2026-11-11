import { z } from "zod";

export const OUTCOMES = ["resolved", "settled", "filed", "waiting", "nothing"] as const;

const ruleKey = z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/);
const stateCode = z.string().regex(/^[A-Z]{2}$/);

const eventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("check"),
    rule: ruleKey,
    status: z.enum(["safe", "approaching", "urgent", "expired"]),
    state: stateCode.optional()
  }),
  z.object({ type: z.literal("notice"), rule: ruleKey }),
  z.object({
    type: z.literal("followup"),
    outcome: z.enum(OUTCOMES),
    recovered: z.number().int().min(0).max(100000000).optional(),
    state: stateCode.optional()
  })
]);

export interface EventContext {
  isKnownRule(key: string): boolean;
  isKnownState(code: string): boolean;
}

export function counterIncrements(raw: unknown, context: EventContext): [string, number][] | null {
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) return null;
  const event = parsed.data;
  if (event.type !== "followup" && !context.isKnownRule(event.rule)) return null;
  if (event.type !== "notice" && event.state && !context.isKnownState(event.state)) return null;

  const out: [string, number][] = [];
  if (event.type === "check") {
    out.push(["checks", 1], [`status:${event.status}`, 1], [`rule:${event.rule}`, 1]);
  } else if (event.type === "notice") {
    out.push(["notices", 1], [`notice-rule:${event.rule}`, 1]);
  } else {
    out.push(["followups", 1], [`outcome:${event.outcome}`, 1]);
    if (event.recovered) out.push(["recovered_rupees", event.recovered]);
  }
  if (event.type !== "notice" && event.state) out.push([`state:${event.state}`, 1]);
  return out;
}
