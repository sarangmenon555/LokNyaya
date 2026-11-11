interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare("SELECT key, value FROM counters").all<{ key: string; value: number }>();
  const counters: Record<string, number> = {};
  for (const row of results) counters[row.key] = row.value;
  return Response.json({ counters }, { headers: { "Cache-Control": "public, max-age=60" } });
};
