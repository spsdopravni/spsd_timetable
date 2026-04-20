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
