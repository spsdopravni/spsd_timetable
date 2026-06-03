import type { Departure } from "@/types/pid";

// Speciální „vložený spoj" metra C v úseku Nádraží Holešovice – depo Kačerov
// a zpět, v provozu během Dne otevřených dveří v depu Kačerov (6. 6. 2026).
// Není v PID API — odjezdy generujeme lokálně z pevného jízdního řádu.

// Odjezdy ze stanice depo Kačerov (směr Nádraží Holešovice).
// Tabule stojí přímo v depu, takže nás zajímají jen odjezdy odsud.
const DEPO_TO_HOLESOVICE = [
  "10:30", "11:00", "11:30", "12:00", "12:30", "13:00",
  "13:30", "14:00", "14:30", "15:00", "15:30", "16:15",
];

function todayAtHHMM(hhmm: string, now: Date): number {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

function buildDepartures(
  times: string[],
  headsign: string,
  dirKey: string,
  now: Date,
  maxItems: number
): Departure[] {
  const nowSec = Math.floor(now.getTime() / 1000);
  const result: Departure[] = [];

  for (const t of times) {
    const ts = todayAtHHMM(t, now);
    // Přeskoč odjezdy v minulosti i ty, co by se zobrazily jako „<1 min".
    if (ts - nowSec < 60) continue;

    result.push({
      arrival_timestamp: ts,
      departure_timestamp: ts,
      delay: 0,
      route_short_name: "C",
      route_type: 1, // metro
      route_id: `depo-kacerov-metro-${dirKey}`,
      route_long_name: "Vložený spoj metra C — Den otevřených dveří depo Kačerov",
      route_color: "E20613",
      route_text_color: "FFFFFF",
      headsign,
      is_night: false,
      trip_id: `depo-kacerov-metro-${dirKey}-${t}`,
      trip_number: t.replace(":", ""),
      stop_sequence: 0,
      wheelchair_accessible: true,
      low_floor: true,
      air_conditioning: true,
      agency_name: "DPP — Den otevřených dveří",
    });
  }

  result.sort((a, b) => a.departure_timestamp - b.departure_timestamp);
  return result.slice(0, maxItems);
}

// Odjezdy z depa Kačerov směr Nádraží Holešovice (co cestující na tabuli v depu
// nejvíc potřebuje — návrat z akce).
export function generateDepoKacerovOut(now: Date, maxItems = 10): Departure[] {
  return buildDepartures(DEPO_TO_HOLESOVICE, "Nádraží Holešovice", "out", now, maxItems);
}
