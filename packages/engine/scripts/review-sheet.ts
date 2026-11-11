import { fileURLToPath } from "node:url";
import { loadPacks } from "../src/node";

const dir = fileURLToPath(new URL("../../../packs", import.meta.url));
const wanted = process.argv[2];
const packs = loadPacks(dir).filter((p) => !wanted || p.id === wanted);

if (packs.length === 0) {
  console.error("No matching pack. Pass a pack id, or nothing for every pack.");
  process.exit(1);
}

const out: string[] = [];
for (const pack of packs) {
  const where = pack.jurisdictions.length > 0 ? ` (${pack.jurisdictions.join(", ")})` : "";
  out.push(
    `# Review sheet: ${pack.title}`,
    "",
    `Pack id: ${pack.id}`,
    `Layer: ${pack.layer}${where}`,
    `Status: ${pack.verification.status}`,
    `Acts: ${pack.acts.join("; ")}`,
    "",
    "Check every item against the official text. Write the correct value beside any item that differs.",
    ""
  );
  for (const rule of pack.rules) {
    const l = rule.limitation;
    out.push(
      `## ${rule.label} (${rule.id})`,
      "",
      `- [ ] Period: ${l.period.amount} ${l.period.unit}`,
      `- [ ] Clock starts: ${l.starts}`,
      `- [ ] Source: ${l.source}`,
      `- [ ] Late filing can be excused: ${l.condonable ? "yes" : "no"}`,
      `- [ ] A written acknowledgement restarts the period: ${l.acknowledgementExtends ? "yes" : "no"}`
    );
    for (const f of rule.forums) {
      const band = f.maxInclusive !== null ? ` (value up to ${f.maxInclusive})` : "";
      out.push(`- [ ] Forum: ${f.name}${band}${f.notes ? `. ${f.notes}` : ""}`);
    }
    for (const d of rule.documents) out.push(`- [ ] Document: ${d}`);
    if (rule.notes) out.push(`- [ ] Note: ${rule.notes}`);
    out.push("");
  }
  out.push("Reviewer name:", "Date:", "Verdict (verified or needs changes):", "");
}
console.log(out.join("\n"));
