import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { packSchema } from "../src/schema";

const dir = fileURLToPath(new URL("../../../packs", import.meta.url));
const [id, ...nameParts] = process.argv.slice(2);
const reviewer = nameParts.join(" ").trim();

if (!id || !reviewer) {
  console.error("Usage: pnpm --filter @loknyaya/engine verify-pack <pack-id> <reviewer name>");
  process.exit(1);
}

const file = readdirSync(dir)
  .filter((name) => name.endsWith(".json"))
  .find((name) => {
    try {
      return JSON.parse(readFileSync(join(dir, name), "utf8")).id === id;
    } catch {
      return false;
    }
  });

if (!file) {
  console.error(`No pack with id ${id}`);
  process.exit(1);
}

const path = join(dir, file);
const data = JSON.parse(readFileSync(path, "utf8"));
data.verification = { status: "verified", lastVerified: new Date().toISOString().slice(0, 10), reviewer };
packSchema.parse(data);
writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
console.log(`Marked ${id} as verified by ${reviewer}`);
