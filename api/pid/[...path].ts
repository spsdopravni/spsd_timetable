/**
 * Vercel serverless function: /api/pid/*
 *
 * Proxy na Golemio (PID API). Existuje ze stejného důvodu jako obdoba
 * v nginxu (docker/nginx.conf.template): klíče k API nesmí být v klientském
 * bundlu, protože si je odtud kdokoli přečte.
 *
 * Klient posílá jen jméno slotu v hlavičce X-Api-Slot (k1/k2/k3/pragensis),
 * skutečný klíč se doplní tady z proměnných prostředí.
 *
 * Nastav v projektu na Vercelu:
 *   GOLEMIO_KEY_1, GOLEMIO_KEY_2, GOLEMIO_KEY_3, GOLEMIO_KEY_PRAGENSIS
 */

const UPSTREAM = "https://api.golemio.cz";
const FETCH_TIMEOUT_MS = 10_000;

function keyForSlot(slot: string | undefined): string {
  const env = process.env;
  switch (slot) {
    case "k2": return env.GOLEMIO_KEY_2 || "";
    case "k3": return env.GOLEMIO_KEY_3 || "";
    case "pragensis": return env.GOLEMIO_KEY_PRAGENSIS || "";
    default: return env.GOLEMIO_KEY_1 || "";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  // Cesta za /api/pid/ plus původní query.
  const raw: string = req.url || "";
  const rest = raw.replace(/^\/api\/pid\/?/, "");
  if (!rest || rest.startsWith("..")) {
    res.status(400).json({ error: "chybí cesta" });
    return;
  }

  const slot = Array.isArray(req.headers["x-api-slot"])
    ? req.headers["x-api-slot"][0]
    : req.headers["x-api-slot"];
  const key = keyForSlot(slot);
  if (!key) {
    res.status(500).json({ error: `chybí klíč pro slot "${slot ?? "k1"}" v prostředí` });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${UPSTREAM}/${rest}`, {
      headers: { "X-Access-Token": key, "Content-Type": "application/json" },
      signal: controller.signal,
    });

    const body = await upstream.text();
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    // Odjezdy se mění po desítkách sekund; stale-while-revalidate drží tabuli
    // s daty i když Golemio zrovna limituje nebo vypadne.
    res.setHeader("Cache-Control", "public, s-maxage=20, stale-while-revalidate=120");
    res.status(upstream.status).send(body);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  } finally {
    clearTimeout(timeout);
  }
}
