import { counterIncrements } from "@loknyaya/engine";
import { jurisdictions, registry } from "@loknyaya/engine/bundled";

interface Env {
  DB: D1Database;
}

const codes = new Set(jurisdictions.map((j) => j.code));

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.text();
  if (body.length > 2000) return new Response(null, { status: 413 });
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }
  const increments = counterIncrements(raw, {
    isKnownRule: (key) => {
      const [pack, rule] = key.split("/");
      return Boolean(pack && rule && registry.findRule(pack, rule));
    },
    isKnownState: (code) => codes.has(code)
  });
  if (!increments) return new Response(null, { status: 400 });
  await env.DB.batch(
    increments.map(([key, value]) =>
      env.DB.prepare(
        "INSERT INTO counters (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = value + excluded.value"
      ).bind(key, value)
    )
  );
  return new Response(null, { status: 204 });
};
