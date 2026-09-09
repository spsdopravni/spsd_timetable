// Speciální jízdní řád linky PID3 pro Autobusový den PID 2026
// Datum: sobota 16. 5. 2026, 10:00-17:00, Letenská pláň
// Zdroj: ROPID LJR_PID3.pdf / VJR_PID3.pdf
//
// Trasa: Letenská pláň → Hradčanská → Voz.Střešovice → Kajetánka → Břevnovská
//        → Vypich → Weberova → Kotlářka → Vozovna Motol → Motol → Nemocnice Motol
//        → Vypich → Břevnovská → Kajetánka → Voz.Střešovice → Hradčanská → Letenská pláň
// Okružní jízda, každých 15 min od 10:00 do 16:30 (poslední odjezd z Letenské).

export const PID_DAY_DATE = "2026-05-16";

export type Pid3StopName =
  | "Letenská pláň"
  | "Hradčanská"
  | "Voz.Střešovice"
  | "Kajetánka"
  | "Břevnovská"
  | "Vypich"
  | "Weberova"
  | "Kotlářka"
  | "Vozovna Motol"
  | "Motol"
  | "Nemocnice Motol"
  | "Vypich (zpět)"
  | "Břevnovská (zpět)"
  | "Kajetánka (zpět)"
  | "Voz.Střešovice (zpět)"
  | "Hradčanská (zpět)"
  | "Letenská pláň (cíl)";

// Offsety v minutách od odjezdu z Letenské pláně (kolo 1)
// Z LJR_PID3.pdf prvního sloupce (odjezd 10:00 z Letenské):
const OFFSETS: Record<Pid3StopName, number> = {
  "Letenská pláň": 0,
  "Hradčanská": 5,
  "Voz.Střešovice": 8,
  "Kajetánka": 12,
  "Břevnovská": 13,
  "Vypich": 16,
  "Weberova": 20,
  "Kotlářka": 21,
  "Vozovna Motol": 24,
  "Motol": 30,
  "Nemocnice Motol": 33,
  "Vypich (zpět)": 36,
  "Břevnovská (zpět)": 39,
  "Kajetánka (zpět)": 40,
  "Voz.Střešovice (zpět)": 44,
  "Hradčanská (zpět)": 47,
  "Letenská pláň (cíl)": 50,
};

// Odjezdy z Letenské pláně (počátku trasy) - kompletní seznam.
// PREVIEW MODE: 24/7 rozvrh každých 15 min, aby tabule ukazovala odjezdy
// kdykoliv během dne. Pro ostrý Den PID 16. 5. 2026 stačí omezit zpět na
// 10:00–16:30 (změnit `start = 0` na `10 * 60` a `end = 23 * 60 + 45`
// na `16 * 60 + 30`).
const LETENSKA_DEPARTURES_HHMM: string[] = (() => {
  const out: string[] = [];
  const start = 0; // 00:00
  const end = 23 * 60 + 45; // 23:45
  for (let m = start; m <= end; m += 15) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return out;
})();

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHhmm(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Vrátí všechny časy odjezdů linky PID3 z dané zastávky (HH:MM v Praze).
export function getPid3StopTimes(stop: Pid3StopName): string[] {
  const offset = OFFSETS[stop];
  return LETENSKA_DEPARTURES_HHMM.map((dep) =>
    minutesToHhmm(hhmmToMinutes(dep) + offset)
  );
}

// Vrátí destinaci, kterou má vůz na headsignu, když odjíždí ze stop.
// Pro směr "tam" (Letenská → Motol) cíl = "Nemocnice Motol" (resp. okruh).
// Pro "zpět" (Motol → Letenská) cíl = "Letenská pláň".
export function getPid3Headsign(stop: Pid3StopName): string {
  const outboundOrder: Pid3StopName[] = [
    "Letenská pláň",
    "Hradčanská",
    "Voz.Střešovice",
    "Kajetánka",
    "Břevnovská",
    "Vypich",
    "Weberova",
    "Kotlářka",
    "Vozovna Motol",
    "Motol",
    "Nemocnice Motol",
  ];
  if (outboundOrder.includes(stop)) return "Nemocnice Motol";
  return "Letenská pláň";
}

// Mapování "logické" zastávky ze schedule na zobrazený název nástupiště
// (pro tabuli, aby šlo přidat zpáteční směr odlišně).
export const PID3_STOP_LABEL: Record<Pid3StopName, string> = {
  "Letenská pláň": "Letenská pláň → Motol",
  "Hradčanská": "Hradčanská → Motol",
  "Voz.Střešovice": "Voz.Střešovice → Motol",
  "Kajetánka": "Kajetánka → Motol",
  "Břevnovská": "Břevnovská → Motol",
  "Vypich": "Vypich → Motol",
  "Weberova": "Weberova → Motol",
  "Kotlářka": "Kotlářka → Motol",
  "Vozovna Motol": "Vozovna Motol → Motol",
  "Motol": "Motol → Letenská",
  "Nemocnice Motol": "Nemocnice Motol → Letenská",
  "Vypich (zpět)": "Vypich → Letenská",
  "Břevnovská (zpět)": "Břevnovská → Letenská",
  "Kajetánka (zpět)": "Kajetánka → Letenská",
  "Voz.Střešovice (zpět)": "Voz.Střešovice → Letenská",
  "Hradčanská (zpět)": "Hradčanská → Letenská",
  "Letenská pláň (cíl)": "Letenská pláň (cíl)",
};

// Vrátí, zda je dnes Den PID (akce aktivní).
// PREVIEW MODE: aktuálně vrací vždy true — tabule ukazuje PID Day odjezdy i mimo
// reálný termín 16. 5. 2026. Před ostrým dnem přepnout zpět na datum check.
export function isPidDayToday(_now: Date = new Date()): boolean {
  return true;
}

// =====================================================================
// Všechny linky PID Day (1, 2, 3, 4, 5, 7, 8 — PID6 v oficiálním seznamu
// na pid.cz není). Pro PID1, 2, 4, 5, 7, 8 zatím nemáme konkrétní časy
// z PDF, takže používáme stejný 15-min takt jako PID3 se staggerem aby
// se vůz po vozu z Letenské odjížděly v rozumných odstupech.
// =====================================================================

export type PidDayLineNum = "1" | "2" | "3" | "4" | "5" | "7" | "8";

export interface PidDayLineMeta {
  num: PidDayLineNum;
  headsign: string;       // cíl při odjezdu z Letenské
  routeColor: string;     // hex bez #
  routeTextColor: string;
  departures: string[];   // konkrétní časy HH:MM odjezdů z Letenské pláně
}

// Pomocná funkce pro pravidelný takt (interval v min, end inclusive).
function regular(startHHMM: string, endHHMM: string, intervalMin: number, skip: string[] = []): string[] {
  const [sh, sm] = startHHMM.split(":").map(Number);
  const [eh, em] = endHHMM.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const out: string[] = [];
  for (let m = startMin; m <= endMin; m += intervalMin) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const t = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    if (!skip.includes(t)) out.push(t);
  }
  return out;
}

// Reálné jízdní řády z PDF na pid.cz/autobusovy-den-pid-2026 (ZJR_CSAD_PIDx.pdf).
// Barvy odpovídají PDF mapám tras.
export const PID_DAY_LINES: PidDayLineMeta[] = [
  {
    num: "1",
    headsign: "Sídliště Bohnice",
    routeColor: "e6244f",
    routeTextColor: "ffffff",
    // 15 min takt, 10:00–16:45
    departures: regular("10:00", "16:45", 15),
  },
  {
    num: "2",
    headsign: "Karlín · Urxova",
    routeColor: "ee7203",
    routeTextColor: "ffffff",
    // 15 min takt, 10:00–16:00
    departures: regular("10:00", "16:00", 15),
  },
  {
    num: "3",
    headsign: "Vozovna Motol",
    routeColor: "8dc63f",
    routeTextColor: "ffffff",
    // 15 min takt, 10:00–16:30
    departures: regular("10:00", "16:30", 15),
  },
  {
    num: "4",
    headsign: "Petřiny · Větrník",
    routeColor: "29abe2",
    routeTextColor: "ffffff",
    // 30 min takt, 10:15–16:45
    departures: regular("10:15", "16:45", 30),
  },
  {
    num: "5",
    headsign: "Macharovo nám.",
    routeColor: "5e2b97",
    routeTextColor: "ffffff",
    // 45 min takt, 10:00–16:00, navíc 16:30
    departures: ["10:00", "10:45", "11:30", "12:15", "13:00", "13:45", "14:30", "15:15", "16:00", "16:30"],
  },
  {
    num: "7",
    headsign: "Hradčanská · Vltavská",
    routeColor: "2dbca8",
    routeTextColor: "ffffff",
    // 20 min takt, 10:05–16:45, plus 16:55, 17:00
    departures: [...regular("10:05", "16:45", 20), "16:55", "17:00"],
  },
  {
    num: "8",
    headsign: "vyhlídka po Letné",
    routeColor: "d75a2e",
    routeTextColor: "ffffff",
    // 15 min takt, 10:00–16:45, s mezerami u 12:30, 13:15, 16:30
    departures: regular("10:00", "16:45", 15, ["12:30", "13:15", "16:30"]),
  },
];
