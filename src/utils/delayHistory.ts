import { supabase } from "./supabase";

const lastSnapshot = new Map<string, number>(); // trip_id → timestamp ms

/**
 * Zapíše snapshot pozorovaného zpoždění. Throttluje na 1× za 60s per trip,
 * aby DB nepřekypoval. Volá se pasivně z DepartureTracker live polling.
 */
export async function recordDelaySnapshot(args: {
  tripId?: string;
  routeShortName: string;
  routeType: number;
  delaySeconds: number;
}): Promise<void> {
  if (!args.tripId) return;
  const now = Date.now();
  const last = lastSnapshot.get(args.tripId);
  if (last && now - last < 60_000) return;
  lastSnapshot.set(args.tripId, now);

  const d = new Date();
  await supabase.from("delay_snapshots").insert({
    route_short_name: args.routeShortName,
    route_type: args.routeType,
    trip_id: args.tripId,
    delay_seconds: args.delaySeconds,
    hour_of_day: d.getHours(),
    day_of_week: d.getDay(),
  }).then(() => {}, () => {}); // fire-and-forget, errors ignorovány
}

const lastBoardSnapshot = new Map<string, number>(); // trip_id → timestamp ms
const BOARD_SNAPSHOT_THROTTLE_MS = 10 * 60_000;

/**
 * Pasivní sběr zpoždění z odjezdů, které tabule stejně stahuje (každou
 * minutu, všechny stanice). Díky tomu se historie plní i bez mobilní appky
 * a predikce „obvykle +X min“ mají z čeho počítat.
 *
 * Throttle 10 min per spoj: každý spoj je v seznamu ~30 min, takže z něj
 * vzniknou max. 3 řádky. Přeskakují se spoje bez reálného hlášení polohy.
 */
export function recordDelaySnapshotsFromDepartures(
  departures: { trip_id?: string; route_short_name: string; route_type: number; delay?: number; delay_available?: boolean }[],
): void {
  const now = Date.now();
  const rows: {
    route_short_name: string;
    route_type: number;
    trip_id: string;
    delay_seconds: number;
    hour_of_day: number;
    day_of_week: number;
  }[] = [];
  const d = new Date();

  for (const dep of departures) {
    if (!dep.trip_id || !dep.delay_available || dep.delay === undefined) continue;
    const last = lastBoardSnapshot.get(dep.trip_id);
    if (last && now - last < BOARD_SNAPSHOT_THROTTLE_MS) continue;
    lastBoardSnapshot.set(dep.trip_id, now);
    rows.push({
      route_short_name: dep.route_short_name,
      route_type: dep.route_type,
      trip_id: dep.trip_id,
      delay_seconds: Math.round(dep.delay),
      hour_of_day: d.getHours(),
      day_of_week: d.getDay(),
    });
  }

  // Úklid mapy, ať při 24/7 provozu neroste donekonečna.
  if (lastBoardSnapshot.size > 2000) {
    for (const [k, ts] of lastBoardSnapshot) {
      if (now - ts > 2 * 60 * 60_000) lastBoardSnapshot.delete(k);
    }
  }

  if (rows.length === 0) return;
  supabase.from("delay_snapshots").insert(rows).then(() => {}, () => {}); // fire-and-forget
}

interface DelayAverage {
  route_short_name: string;
  hour_of_day: number;
  avg_delay_seconds: number;
  samples: number;
}

const averagesCache = new Map<string, { data: DelayAverage | null; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Vrátí průměrné zpoždění linky v dané hodině (z view delay_averages).
 * Cachováno 5 min v memory.
 */
export async function getAverageDelay(
  routeShortName: string,
  hourOfDay: number,
): Promise<DelayAverage | null> {
  const key = `${routeShortName}-${hourOfDay}`;
  const cached = averagesCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const { data, error } = await supabase
    .from("delay_averages")
    .select("route_short_name, hour_of_day, avg_delay_seconds, samples")
    .eq("route_short_name", routeShortName)
    .eq("hour_of_day", hourOfDay)
    .maybeSingle();

  const result: DelayAverage | null = error || !data ? null : data as DelayAverage;
  averagesCache.set(key, { data: result, ts: Date.now() });
  return result;
}

export type DelayAverageMap = Map<string, DelayAverage>; // klíč `${linka}-${hodina}`

export const delayAverageKey = (routeShortName: string, hourOfDay: number) => `${routeShortName}-${hourOfDay}`;

const bulkCache = new Map<string, { data: DelayAverageMap; ts: number }>();
const BULK_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Hromadně načte průměrná zpoždění (všechny hodiny) pro sadu linek – jeden
 * dotaz pro celou tabuli místo dotazu per spoj. Cache 10 min.
 */
export async function getAverageDelaysForRoutes(routeShortNames: string[]): Promise<DelayAverageMap> {
  const routes = Array.from(new Set(routeShortNames)).sort();
  if (routes.length === 0) return new Map();

  const cacheKey = routes.join("|");
  const cached = bulkCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < BULK_CACHE_TTL_MS) return cached.data;

  const map: DelayAverageMap = new Map();
  try {
    const { data, error } = await supabase
      .from("delay_averages")
      .select("route_short_name, hour_of_day, avg_delay_seconds, samples")
      .in("route_short_name", routes);
    if (!error && data) {
      for (const row of data as DelayAverage[]) {
        map.set(delayAverageKey(row.route_short_name, row.hour_of_day), row);
      }
    }
  } catch {
    // offline / chyba – prostě bez predikcí
  }

  bulkCache.set(cacheKey, { data: map, ts: Date.now() });
  return map;
}
