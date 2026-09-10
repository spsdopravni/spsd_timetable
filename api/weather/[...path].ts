/**
 * Vercel serverless function: /api/weather/*
 *
 * Proxy na WeatherAPI. Klíč zůstává na serveru, klient ho neposílá.
 * Nastav v projektu na Vercelu: WEATHER_KEY
 */

const UPSTREAM = "https://api.weatherapi.com/v1";
const FETCH_TIMEOUT_MS = 10_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  const raw: string = req.url || "";
  const rest = raw.replace(/^\/api\/weather\/?/, "");
  if (!rest || rest.startsWith("..")) {
    res.status(400).json({ error: "chybí cesta" });
    return;
  }

  const key = process.env.WEATHER_KEY || "";
  if (!key) {
    res.status(500).json({ error: "chybí WEATHER_KEY v prostředí" });
    return;
  }

  const [path, query = ""] = rest.split("?");
  const url = `${UPSTREAM}/${path}?key=${encodeURIComponent(key)}${query ? `&${query}` : ""}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(url, { signal: controller.signal });
    const body = await upstream.text();
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800");
    res.status(upstream.status).send(body);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  } finally {
    clearTimeout(timeout);
  }
}
