/**
 * Mimořádnosti a výluky PID pro tabuli.
 *
 * Data přicházejí z /api/pid-alerts (Vercel function, viz api/pid-alerts.ts),
 * která překládá RSS kanály pid.cz do JSONu. Tady se jen stahují, cachují
 * a filtrují na linky, které daná tabule zobrazuje.
 */

export interface PidAlert {
  id: string;
  kind: "mimoradnost" | "vyluka";
  title: string;
  link: string;
  from: number | null;
  to: number | null;
  lines: string[];
  text: string;
  priority: number | null;
}

const ENDPOINT = "/api/pid-alerts";
const CACHE_TTL_MS = 3 * 60 * 1000;

let cache: { items: PidAlert[]; ts: number } | null = null;
let inflight: Promise<PidAlert[]> | null = null;

export async function fetchPidAlerts(): Promise<PidAlert[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.items;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(ENDPOINT, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw: PidAlert[] = Array.isArray(data?.items) ? data.items : [];
      // Deduplikace linek (RSS občas uvádí "C" dvakrát – pro každou stanici zvlášť).
      const items = raw.map((it) => ({
        ...it,
        lines: Array.from(new Set((it.lines || []).map((l) => l.trim()).filter(Boolean))),
      }));
      cache = { items, ts: Date.now() };
      return items;
    } catch {
      // Při chybě vrať poslední známá data (i prošlá), ať banner nezmizí
      // kvůli jednomu výpadku sítě.
      return cache?.items ?? [];
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Normalizace čísla linky pro porovnání ("X 9" → "X9", "a" → "A"). */
export function normalizeLine(line: string): string {
  return line.replace(/\s+/g, "").toUpperCase();
}

export interface SelectOptions {
  /** Unix čas (s) „teď“ */
  now: number;
  /** Kolik sekund dopředu ukazovat i teprve začínající výluky (default 6 h) */
  lookaheadSeconds?: number;
}

/**
 * Vybere alerty relevantní pro dané linky: buď právě platné, nebo začínající
 * během `lookaheadSeconds`. Mimořádnosti mají přednost před plánovanými
 * výlukami, novější před staršími.
 */
export function selectAlertsForLines(alerts: PidAlert[], lines: string[], opts: SelectOptions): PidAlert[] {
  const wanted = new Set(lines.map(normalizeLine));
  if (wanted.size === 0) return [];

  const lookahead = opts.lookaheadSeconds ?? 6 * 3600;
  const now = opts.now;

  return alerts
    .filter((a) => a.lines.some((l) => wanted.has(normalizeLine(l))))
    .filter((a) => {
      const started = a.from === null || a.from <= now + lookahead;
      const notEnded = a.to === null || a.to >= now;
      return started && notEnded;
    })
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "mimoradnost" ? -1 : 1;
      const aActive = a.from === null || a.from <= now;
      const bActive = b.from === null || b.from <= now;
      if (aActive !== bActive) return aActive ? -1 : 1;
      return (b.from ?? 0) - (a.from ?? 0);
    });
}

/**
 * Barva štítku linky podle druhu dopravy (stejně jako reálné značení PID):
 * metro A zelená, B žlutá, C červená; tramvaje (1–2místná čísla) jednotně
 * červené; autobusy, náhradní X-linky a ostatní modré.
 */
export function getLineBadgeStyle(line: string): { background: string; color: string } {
  const l = normalizeLine(line);
  if (l === "A") return { background: "#00A562", color: "#ffffff" };
  if (l === "B") return { background: "#FFD400", color: "#1a1a1a" };
  if (l === "C") return { background: "#E2001A", color: "#ffffff" };
  if (/^\d{1,2}$/.test(l)) return { background: "#dc2626", color: "#ffffff" }; // tramvaj
  return { background: "#2563eb", color: "#ffffff" }; // autobus / X-linka / ostatní
}

/** Textový popis platnosti, např. „do 12. 9. 04:30“ nebo „do odvolání“. */
export function formatValidity(alert: PidAlert, now: number): string {
  const fmt = (unix: number) => {
    const d = new Date(unix * 1000);
    const sameDay = new Date(now * 1000).toDateString() === d.toDateString();
    const time = d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
    if (sameDay) return `dnes ${time}`;
    return `${d.getDate()}. ${d.getMonth() + 1}. ${time}`;
  };

  const startsLater = alert.from !== null && alert.from > now;
  if (startsLater) {
    return alert.to ? `od ${fmt(alert.from!)} do ${fmt(alert.to)}` : `od ${fmt(alert.from!)}`;
  }
  return alert.to ? `do ${fmt(alert.to)}` : "do odvolání";
}
