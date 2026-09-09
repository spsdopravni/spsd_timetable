// Generuje pole "fake" Departure záznamů pro linku PID3 (Autobusový den PID 2026)
// na základě lokálního jízdního řádu. Slouží pro injektování do DataContext jako
// virtuální stationKey "pid3Letna" a "pid3VozovnaMotol".

import type { Departure } from "@/types/pid";
import {
  getPid3StopTimes,
  getPid3Headsign,
  isPidDayToday,
  PID_DAY_DATE,
  PID_DAY_LINES,
  type Pid3StopName,
  type PidDayLineNum,
} from "@/data/piddaySchedule";

// Vytvoří timestamp pro dnešní den a danou HH:MM (lokální čas Prahy).
function todayAtHHMM(hhmm: string, now: Date): number {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

export function generatePid3Departures(
  stop: Pid3StopName,
  now: Date,
  maxItems = 8
): Departure[] {
  // Mimo den PID nezobrazujeme nic - tabule se přepne na běžné odjezdy.
  if (!isPidDayToday(now)) return [];

  const times = getPid3StopTimes(stop);
  const headsign = getPid3Headsign(stop);
  const nowSec = Math.floor(now.getTime() / 1000);

  const futureDepartures: Departure[] = [];
  for (let i = 0; i < times.length; i++) {
    const ts = todayAtHHMM(times[i], now);
    // Ukazujeme i odjezdy které právě teď probíhají (do +30s),
    // a všechny budoucí.
    if (ts + 30 < nowSec) continue;

    futureDepartures.push({
      arrival_timestamp: ts,
      departure_timestamp: ts,
      delay: 0,
      route_short_name: "PID3",
      route_type: 3, // bus
      route_id: `pidday-PID3-${PID_DAY_DATE}`,
      route_long_name: "Den PID 2026 — speciální linka",
      route_color: "1a4b8c",
      route_text_color: "ffffff",
      headsign,
      is_night: false,
      trip_id: `pidday-PID3-${PID_DAY_DATE}-${times[i]}`,
      trip_number: times[i].replace(":", ""),
      stop_sequence: 0,
      wheelchair_accessible: true,
      low_floor: false,
      air_conditioning: false,
      agency_name: "ROPID — Den PID",
    });

    if (futureDepartures.length >= maxItems) break;
  }

  return futureDepartures;
}

// Vrátí všechny budoucí odjezdy PID Day linek z Letenské pláně (chronologicky).
// Tabule pak ukazuje konkrétní jízdy podle reálných JŘ — linka se může opakovat.
export function generatePidDayLetenskaDepartures(
  now: Date,
  maxItems = 20,
  lineFilter?: PidDayLineNum[]
): Departure[] {
  if (!isPidDayToday(now)) return [];

  const nowSec = Math.floor(now.getTime() / 1000);
  const lines = lineFilter
    ? PID_DAY_LINES.filter((l) => lineFilter.includes(l.num))
    : PID_DAY_LINES;

  const result: Departure[] = [];

  for (const line of lines) {
    for (const t of line.departures) {
      const ts = todayAtHHMM(t, now);
      // Skip odjezdy v minulosti i ty co by se zobrazily jako "<1 min".
      if (ts - nowSec < 60) continue;

      result.push({
        arrival_timestamp: ts,
        departure_timestamp: ts,
        delay: 0,
        route_short_name: `PID${line.num}`,
        route_type: 3, // bus
        route_id: `pidday-PID${line.num}-${PID_DAY_DATE}`,
        route_long_name: `Den PID 2026 — speciální linka PID${line.num}`,
        route_color: line.routeColor,
        route_text_color: line.routeTextColor,
        headsign: line.headsign,
        is_night: false,
        trip_id: `pidday-PID${line.num}-${PID_DAY_DATE}-${t}`,
        trip_number: t.replace(":", ""),
        stop_sequence: 0,
        wheelchair_accessible: false,
        low_floor: false,
        air_conditioning: false,
        agency_name: "ROPID — Den PID",
      });
    }
  }

  result.sort((a, b) => a.departure_timestamp - b.departure_timestamp);
  return result.slice(0, maxItems);
}
