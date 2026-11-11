import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const limitationSpecSchema = z.object({
  period: z.object({
    amount: z.number().int().positive(),
    unit: z.enum(["days", "months", "years"])
  }),
  starts: z.string().min(1),
  source: z.string().min(1),
  condonable: z.boolean().default(false),
  acknowledgementExtends: z.boolean().default(true)
});

export const forumSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  minExclusive: z.number().nonnegative().default(0),
  maxInclusive: z.number().positive().nullable().default(null),
  notes: z.string().default("")
});

export const goldenCaseSchema = z.object({
  name: z.string().min(1),
  input: z.object({
    start: isoDate,
    today: isoDate,
    exclusions: z.array(z.object({ from: isoDate, to: isoDate })).default([]),
    acknowledgements: z.array(isoDate).default([]),
    closedDates: z.array(isoDate).default([])
  }),
  expect: z.object({
    deadline: isoDate,
    status: z.enum(["safe", "approaching", "urgent", "expired"])
  })
});

export const ruleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  limitation: limitationSpecSchema,
  forums: z.array(forumSchema).default([]),
  documents: z.array(z.string()).default([]),
  draft: z.enum(["demand-notice"]).nullable().default(null),
  notes: z.string().default(""),
  golden: z.array(goldenCaseSchema).default([])
});

export const packSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    acts: z.array(z.string()).min(1),
    stateActs: z.array(z.string()).default([]),
    layer: z.enum(["central", "state", "ut"]),
    jurisdictions: z.array(z.string()).default([]),
    verification: z.object({
      status: z.enum(["pending", "verified"]),
      lastVerified: isoDate.nullable(),
      reviewer: z.string().nullable()
    }),
    rules: z.array(ruleSchema).min(1)
  })
  .superRefine((pack, ctx) => {
    const needsJurisdiction = pack.layer !== "central";
    if (needsJurisdiction !== pack.jurisdictions.length > 0) {
      ctx.addIssue({ code: "custom", message: "jurisdictions must be set for state and ut packs and empty for central packs" });
    }
    for (const act of pack.stateActs) {
      if (!pack.acts.includes(act)) ctx.addIssue({ code: "custom", message: `stateActs entry is not listed in acts: ${act}` });
    }
    if (pack.layer === "central" && pack.stateActs.length > 0) {
      ctx.addIssue({ code: "custom", message: "central packs cannot list state acts" });
    }
    if (pack.verification.status === "verified" && !pack.verification.lastVerified) {
      ctx.addIssue({ code: "custom", message: "verified packs need a lastVerified date" });
    }
  });

export const jurisdictionSchema = z.object({
  code: z.string().length(2),
  name: z.string().min(1),
  type: z.enum(["state", "ut"])
});

export type LimitationSpec = z.infer<typeof limitationSpecSchema>;
export type Forum = z.infer<typeof forumSchema>;
export type Rule = z.infer<typeof ruleSchema>;
export type Pack = z.infer<typeof packSchema>;
export type Jurisdiction = z.infer<typeof jurisdictionSchema>;

export const directoryEntrySchema = z.object({
  highCourt: z.string().min(1),
  legalServices: z.string().min(1),
  consumerCommission: z.string().min(1),
  rera: z.string().min(1)
});

export const directorySchema = z.record(z.string().regex(/^[A-Z]{2}$/), directoryEntrySchema);

export type DirectoryEntry = z.infer<typeof directoryEntrySchema>;
export type Directory = z.infer<typeof directorySchema>;

export const concordanceEntrySchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1),
  newCode: z.enum(["BNS", "BNSS", "BSA"]),
  newSections: z.array(z.string().min(1)).min(1),
  oldCode: z.enum(["IPC", "CrPC", "Evidence Act"]).nullable(),
  oldSections: z.array(z.string().min(1)),
  note: z.string(),
  finder: z.boolean()
});

export const concordanceSchema = z.object({
  checkedBy: z.string().min(1),
  checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z.array(concordanceEntrySchema).min(1)
});

export type ConcordanceEntry = z.infer<typeof concordanceEntrySchema>;
export type Concordance = z.infer<typeof concordanceSchema>;
