/**
 * Vercel serverless function: /api/pid-alerts
 *
 * PID publikuje aktuální mimořádnosti a výluky jako RSS (pid.cz/feed/...),
 * ale bez CORS hlaviček, takže je prohlížeč nemůže stáhnout přímo. Tahle
 * funkce oba kanály stáhne, sloučí do jednoduchého JSONu a nechá výsledek
 * cachovat na Vercel edge (2 min), aby se pid.cz nezatěžovalo z každé tabule.
 *
 * Lokální vývoj/preview: Vite proxy přesměruje /api na produkci
 * (viz vite.config.ts), takže funkci není třeba spouštět lokálně.
 */

const FEEDS: { kind: "mimoradnost" | "vyluka"; url: string }[] = [
  { kind: "mimoradnost", url: "https://pid.cz/feed/rss-mimoradnosti/" },
  { kind: "vyluka", url: "https://pid.cz/feed/rss-vyluky/" },
];

const MAX_TEXT_LENGTH = 400;
const FETCH_TIMEOUT_MS = 8000;

export interface PidAlertItem {
  id: string;
  kind: "mimoradnost" | "vyluka";
  title: string;
  link: string;
  /** Unix čas (s) začátku platnosti, nebo null */
  from: number | null;
  /** Unix čas (s) konce platnosti, null = do odvolání */
  to: number | null;
  lines: string[];
  text: string;
  priority: number | null;
}

function tag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? m[1].trim() : "";
}

function stripCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…");
}

function htmlToText(html: string): string {
  return decodeEntities(
    stripCdata(html)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|li|h\d)>/gi, " ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function toUnix(s: string): number | null {
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseFeed(xml: string, kind: PidAlertItem["kind"]): PidAlertItem[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  const out: PidAlertItem[] = [];

  for (const item of items) {
    const title = decodeEntities(stripCdata(tag(item, "title")));
    if (!title) continue;

    const lines = Array.from(
      new Set(
        Array.from(item.matchAll(/<line>([^<]*)<\/line>/g))
          .map((m) => decodeEntities(m[1]).trim())
          .filter(Boolean),
      ),
    );

    let text = htmlToText(tag(item, "content:encoded"));
    if (!text) text = htmlToText(tag(item, "description"));
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.slice(0, MAX_TEXT_LENGTH).replace(/\s+\S*$/, "") + "…";
    }

    const guid = stripCdata(tag(item, "guid")) || tag(item, "link") || title;
    const priorityRaw = tag(item, "priority");

    out.push({
      id: `${kind}-${guid}`,
      kind,
      title,
      link: stripCdata(tag(item, "link")),
      from: toUnix(tag(item, "dateFrom")),
      to: toUnix(tag(item, "dateTo")),
      lines,
      text,
      priority: priorityRaw ? Number(priorityRaw) || null : null,
    });
  }

  return out;
}

async function fetchFeed(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "spsd-timetable/1.0 (+https://timetable.brozovec.eu)" },
    });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function loadPidAlerts(): Promise<{ updatedAt: number; items: PidAlertItem[]; errors: string[] }> {
  const now = Math.floor(Date.now() / 1000);
  const errors: string[] = [];
  const results = await Promise.allSettled(FEEDS.map((f) => fetchFeed(f.url)));

  let items: PidAlertItem[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      items = items.concat(parseFeed(r.value, FEEDS[i].kind));
    } else {
      errors.push(String(r.reason?.message || r.reason));
    }
  });

  // Vyřaď už skončené položky, ať se neposílá zbytečný balast.
  items = items.filter((it) => it.to === null || it.to >= now - 3600);

  return { updatedAt: now, items, errors };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(_req: any, res: any) {
  try {
    const payload = await loadPidAlerts();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    // Vercel CDN cache: 2 min čerstvé, dalších 10 min stale-while-revalidate.
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    res.status(payload.items.length === 0 && payload.errors.length > 0 ? 502 : 200).json(payload);
  } catch (e) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(502).json({ updatedAt: Math.floor(Date.now() / 1000), items: [], errors: [String(e)] });
  }
}
