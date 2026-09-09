import { useState, useEffect, useRef, useCallback } from "react";

// Dev: Vite proxy, Prod: Nginx proxy — both on /meteo
const BASE = "/meteo";

export interface MeteoData {
  teplota: number | null;
  vlhkost: number | null;
  absolutniVlhkost: number | null;
  tlak: number | null;
  tlakMoreHladina: number | null;
  prumernaRychlostVetruKmh: number | null;
  smerVetruKompas: string | null;
  smerVetruStupne: number | null;
  beaufort: string | null;
  srazkyZaDen: number | null;
  srazkyZaMin: number | null;
  rosnyBod: number | null;
}

export type Trend = "up" | "down" | "stable" | null;

export interface WeatherAlert {
  type: "frost" | "heat" | "wind" | "rain";
  message: string;
  severity: "warning" | "danger";
}

export interface MeteoExtras {
  feelsLike: number | null;
  tempTrend: Trend;
  pressureTrend: Trend;
  tempMin: number | null;
  tempMax: number | null;
  alerts: WeatherAlert[];
}

const INITIAL_DATA: MeteoData = {
  teplota: null,
  vlhkost: null,
  absolutniVlhkost: null,
  tlak: null,
  tlakMoreHladina: null,
  prumernaRychlostVetruKmh: null,
  smerVetruKompas: null,
  smerVetruStupne: null,
  beaufort: null,
  srazkyZaDen: null,
  srazkyZaMin: null,
  rosnyBod: null,
};

const INITIAL_EXTRAS: MeteoExtras = {
  feelsLike: null,
  tempTrend: null,
  pressureTrend: null,
  tempMin: null,
  tempMax: null,
  alerts: [],
};

interface SensorEndpoint {
  path: string;
  key: keyof MeteoData;
  transform?: (v: string) => number;
}

const SENSORS: SensorEndpoint[] = [
  { path: "/sensor/teplota", key: "teplota" },
  { path: "/sensor/vlhkost", key: "vlhkost" },
  { path: "/sensor/tlak_", key: "tlak" },
  { path: "/sensor/tlak_na_hladin_moe", key: "tlakMoreHladina" },
  { path: "/sensor/prmrn_rychlost_vtru_kmh", key: "prumernaRychlostVetruKmh" },
  { path: "/sensor/srky_za_den", key: "srazkyZaDen" },
  { path: "/sensor/srky_za_min", key: "srazkyZaMin" },
  { path: "/sensor/absolutn_vlhkost", key: "absolutniVlhkost" },
  { path: "/sensor/rosn_bod", key: "rosnyBod" },
];

const TEXT_SENSORS: SensorEndpoint[] = [
  { path: "/text_sensor/vtr_smr_kompas", key: "smerVetruKompas" },
  { path: "/text_sensor/beaufortova_stupnice", key: "beaufort" },
  { path: "/text_sensor/vitr_smr_stupn", key: "smerVetruStupne", transform: parseFloat },
];

// 12 senzorů = 12 požadavků na kolo. Při 5 s to je 144 req/min na ESP32;
// naměřeno, že polling meteostanice byl hlavní zdroj síťového provozu tabule
// (439 → 83 req/min po zpomalení). Meteodata se takhle rychle nemění.
const POLL_INTERVAL = 15_000; // 15 s
const RETRY_INTERVAL = 30_000; // 30 s – když je stanice nedostupná, zkoušíme ji znovu pomaleji
const FETCH_TIMEOUT = 4_000; // 4 s – aby visící požadavky neblokovaly další kolo
const MAX_FAILS_BEFORE_HIDE = 3;
const TREND_HISTORY_SIZE = 8; // ~2 minuty historie (8 × 15 s)
const TREND_THRESHOLD_TEMP = 0.3; // °C difference to count as trend
const TREND_THRESHOLD_PRESSURE = 0.5; // hPa difference to count as trend

/* ── calculations ──────────────────────────────────────────── */

function calcFeelsLike(temp: number | null, wind: number | null, humidity: number | null): number | null {
  if (temp === null) return null;

  // Wind chill (temp < 10°C, wind > 4.8 km/h)
  if (temp <= 10 && wind !== null && wind > 4.8) {
    return Math.round(
      (13.12 + 0.6215 * temp - 11.37 * Math.pow(wind, 0.16) + 0.3965 * temp * Math.pow(wind, 0.16)) * 10
    ) / 10;
  }

  // Heat index (temp > 27°C, humidity matters)
  if (temp > 27 && humidity !== null) {
    const hi =
      -8.785 +
      1.611 * temp +
      2.339 * humidity -
      0.1461 * temp * humidity -
      0.01231 * temp * temp -
      0.01642 * humidity * humidity +
      0.002212 * temp * temp * humidity +
      0.0007255 * temp * humidity * humidity -
      0.00000359 * temp * temp * humidity * humidity;
    return Math.round(hi * 10) / 10;
  }

  return temp;
}

function calcTrend(history: number[]): Trend {
  if (history.length < 3) return null;
  const oldest = history[0];
  const newest = history[history.length - 1];
  const diff = newest - oldest;
  if (Math.abs(diff) < (history === history ? TREND_THRESHOLD_TEMP : TREND_THRESHOLD_PRESSURE)) return "stable";
  return diff > 0 ? "up" : "down";
}

function calcTrendWithThreshold(history: number[], threshold: number): Trend {
  if (history.length < 3) return null;
  const oldest = history[0];
  const newest = history[history.length - 1];
  const diff = newest - oldest;
  if (Math.abs(diff) < threshold) return "stable";
  return diff > 0 ? "up" : "down";
}

function calcAlerts(data: MeteoData): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  if (data.teplota !== null && data.teplota <= 0) {
    alerts.push({
      type: "frost",
      message: data.teplota <= -5 ? "Silný mráz!" : "Pozor náledí!",
      severity: data.teplota <= -5 ? "danger" : "warning",
    });
  }

  if (data.teplota !== null && data.teplota >= 30) {
    alerts.push({
      type: "heat",
      message: data.teplota >= 35 ? "Extrémní vedro!" : "Tropický den",
      severity: data.teplota >= 35 ? "danger" : "warning",
    });
  }

  if (data.prumernaRychlostVetruKmh !== null && data.prumernaRychlostVetruKmh >= 40) {
    alerts.push({
      type: "wind",
      message: data.prumernaRychlostVetruKmh >= 60 ? "Vichřice!" : "Silný vítr!",
      severity: data.prumernaRychlostVetruKmh >= 60 ? "danger" : "warning",
    });
  }

  if (data.srazkyZaMin !== null && data.srazkyZaMin > 0) {
    alerts.push({
      type: "rain",
      message: data.srazkyZaMin > 0.5 ? "Silný déšť!" : "Venku prší — vezmi si deštník",
      severity: data.srazkyZaMin > 0.5 ? "danger" : "warning",
    });
  }

  return alerts;
}

/* ── hook ───────────────────────────────────────────────────── */

export function useMeteoStation() {
  const [data, setData] = useState<MeteoData>(INITIAL_DATA);
  const [extras, setExtras] = useState<MeteoExtras>(INITIAL_EXTRAS);
  const [connected, setConnected] = useState(false);
  const [available, setAvailable] = useState(true);
  const failCount = useRef(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // trend history buffers
  const tempHistory = useRef<number[]>([]);
  const pressureHistory = useRef<number[]>([]);

  // daily min/max (reset at midnight)
  const minMax = useRef<{ min: number; max: number; day: number } | null>(null);

  const fetchAll = useCallback(async () => {
    // Společný timeout pro celé kolo – bez něj by na Pi po výpadku sítě
    // zůstávaly viset desítky požadavků najednou.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const results = await Promise.allSettled([
        ...SENSORS.map(async (s) => {
          const res = await fetch(`${BASE}${s.path}`, { signal: controller.signal });
          if (!res.ok) throw new Error(res.statusText);
          const json = await res.json();
          // Přijmi jen skutečné číslo. Když na té adrese sedí něco, co vrací
          // jiný tvar, nesmí se undefined dostat do stavu — MeteoStation na
          // něm zavolá .toFixed() a shodí celou tabuli. (Ověřeno testem
          // kontejneru proti stub serveru.)
          const num = typeof json?.value === 'number' ? json.value : Number(json?.value);
          if (!Number.isFinite(num)) throw new Error('nečíselná hodnota');
          return { key: s.key, value: num };
        }),
        ...TEXT_SENSORS.map(async (s) => {
          const res = await fetch(`${BASE}${s.path}`, { signal: controller.signal });
          if (!res.ok) throw new Error(res.statusText);
          const json = await res.json();
          if (json?.value === undefined || json?.value === null) throw new Error('chybí hodnota');
          const value = s.transform ? s.transform(json.value) : json.value;
          if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('nečíselná hodnota');
          return { key: s.key, value };
        }),
      ]);

      const patch: Partial<MeteoData> = {};
      let anySuccess = false;

      for (const r of results) {
        if (r.status === "fulfilled") {
          (patch as any)[r.value.key] = r.value.value;
          anySuccess = true;
        }
      }

      if (anySuccess) {
        setData((prev) => {
          const newData = { ...prev, ...patch };

          // ── update trend history ──
          if (newData.teplota !== null) {
            tempHistory.current.push(newData.teplota);
            if (tempHistory.current.length > TREND_HISTORY_SIZE) tempHistory.current.shift();
          }
          if (newData.tlakMoreHladina !== null) {
            pressureHistory.current.push(newData.tlakMoreHladina);
            if (pressureHistory.current.length > TREND_HISTORY_SIZE) pressureHistory.current.shift();
          }

          // ── update min/max ──
          const today = new Date().getDate();
          if (newData.teplota !== null) {
            if (!minMax.current || minMax.current.day !== today) {
              minMax.current = { min: newData.teplota, max: newData.teplota, day: today };
            } else {
              if (newData.teplota < minMax.current.min) minMax.current.min = newData.teplota;
              if (newData.teplota > minMax.current.max) minMax.current.max = newData.teplota;
            }
          }

          // ── compute extras ──
          setExtras({
            feelsLike: calcFeelsLike(newData.teplota, newData.prumernaRychlostVetruKmh, newData.vlhkost),
            tempTrend: calcTrendWithThreshold(tempHistory.current, TREND_THRESHOLD_TEMP),
            pressureTrend: calcTrendWithThreshold(pressureHistory.current, TREND_THRESHOLD_PRESSURE),
            tempMin: minMax.current?.min ?? null,
            tempMax: minMax.current?.max ?? null,
            alerts: calcAlerts(newData),
          });

          return newData;
        });

        setConnected(true);
        setAvailable(true);
        setLastUpdate(new Date());
        failCount.current = 0;
        return true;
      }

      failCount.current++;
      setConnected(false);
      if (failCount.current >= MAX_FAILS_BEFORE_HIDE) setAvailable(false);
      return false;
    } catch {
      failCount.current++;
      setConnected(false);
      if (failCount.current >= MAX_FAILS_BEFORE_HIDE) setAvailable(false);
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  // Dotazování běží pořád. Když stanice neodpovídá, pruh se po několika
  // neúspěších schová, ale dál se každých 30 s zkouší znovu – po naběhnutí
  // sítě nebo restartu meteostanice se sám objeví. Dřív se po 3 chybách
  // (např. hned po zapnutí Raspberry Pi, než naběhla síť) přestalo dotazovat
  // úplně a počasí zmizelo až do obnovení stránky.
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      const ok = await fetchAll();
      if (cancelled) return;
      const delay = ok || failCount.current < MAX_FAILS_BEFORE_HIDE ? POLL_INTERVAL : RETRY_INTERVAL;
      intervalRef.current = setTimeout(tick, delay);
    };

    tick();

    return () => {
      cancelled = true;
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [fetchAll]);

  return { data, extras, connected, available, lastUpdate };
}
