import { memo, useEffect, useMemo, useState } from "react";
import { useDataContext, useTime } from "@/context/DataContext";
import { fetchPidAlerts, selectAlertsForLines, formatValidity, getLineBadgeStyle, type PidAlert } from "@/utils/pidAlerts";

const REFRESH_MS = 3 * 60 * 1000;
const ROTATE_MS = 10 * 1000;
const FADE_MS = 400;

interface ServiceAlertsProps {
  /** Klíče stanic z ALL_STATIONS, ze kterých se vezmou aktuálně jedoucí linky */
  stationKeys: string[];
  /** Linky, které tabule pokrývá i mimo aktuální odjezdy (např. při úplné výluce) */
  extraLines?: string[];
}

/**
 * Pruh s aktuálními mimořádnostmi a výlukami PID pro linky na tabuli.
 * Zobrazí se jen když nějaká existuje; při více položkách je rotuje po 10 s.
 * Prolínání je jen přes opacity (kompozitor), kvůli Raspberry Pi.
 */
function ServiceAlertsComponent({ stationKeys, extraLines = [] }: ServiceAlertsProps) {
  const time = useTime();
  const { stationData } = useDataContext();
  const [alerts, setAlerts] = useState<PidAlert[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // Linky, které teď na tabuli jedou (+ pevný seznam pro danou budovu).
  const lines = useMemo(() => {
    const set = new Set<string>(extraLines);
    for (const key of stationKeys) {
      for (const dep of stationData[key]?.departures ?? []) {
        if (dep.route_short_name) set.add(dep.route_short_name);
      }
    }
    return Array.from(set).sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationData, stationKeys.join("|"), extraLines.join("|")]);

  // Stahování alertů
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const all = await fetchPidAlerts();
      if (!cancelled) setAlerts(all);
    };
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // Přepočet relevantních alertů jednou za minutu (ne každou sekundu).
  const nowMinute = Math.floor(time.currentTime.getTime() / 60000);
  const relevant = useMemo(
    () => selectAlertsForLines(alerts, lines, { now: nowMinute * 60 }),
    [alerts, lines, nowMinute],
  );

  // Rotace
  useEffect(() => {
    setIndex(0);
    setVisible(true);
    if (relevant.length <= 1) return;
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % relevant.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [relevant.length]);

  if (relevant.length === 0) return null;

  const alert = relevant[index % relevant.length];
  const isIncident = alert.kind === "mimoradnost";
  const now = nowMinute * 60;
  const upcoming = alert.from !== null && alert.from > now;

  const accent = isIncident ? "#dc2626" : "#f59e0b";
  const label = isIncident ? "Mimořádnost" : upcoming ? "Chystaná výluka" : "Výluka";

  return (
    <div
      className="w-full text-white shadow-lg border-b border-white/10"
      style={{ background: "#1f2937", borderLeft: `14px solid ${accent}` }}
    >
      <div
        className="service-alert-fade flex items-center gap-5 px-5"
        style={{ minHeight: "5.5rem", opacity: visible ? 1 : 0 }}
      >
        {/* Ikona + typ */}
        <div className="flex flex-col items-center flex-shrink-0" style={{ width: "7.5rem" }}>
          <i
            className={`fa-solid ${isIncident ? "fa-triangle-exclamation" : "fa-person-digging"}`}
            style={{ fontSize: "2.2rem", color: accent }}
          />
          <span className="uppercase tracking-wider font-bold mt-1" style={{ fontSize: "0.8rem", color: accent }}>
            {label}
          </span>
        </div>

        {/* Linky */}
        <div className="flex flex-wrap gap-1.5 flex-shrink-0" style={{ maxWidth: "16rem" }}>
          {alert.lines.slice(0, 8).map((l) => (
            <span
              key={l}
              className="rounded-md font-bold px-2 py-0.5"
              style={{ ...getLineBadgeStyle(l), fontSize: "1.25rem", lineHeight: 1.3 }}
            >
              {l}
            </span>
          ))}
          {alert.lines.length > 8 && (
            <span className="text-white/60 self-center" style={{ fontSize: "1rem" }}>+{alert.lines.length - 8}</span>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 py-2">
          <div className="font-bold truncate" style={{ fontSize: "1.6rem", lineHeight: 1.2 }}>
            {alert.title}
          </div>
          {alert.text && (
            <div className="text-white/75 truncate" style={{ fontSize: "1.1rem", lineHeight: 1.3 }}>
              {alert.text}
            </div>
          )}
        </div>

        {/* Platnost + počítadlo */}
        <div className="flex flex-col items-end flex-shrink-0 text-white/70" style={{ fontSize: "1rem" }}>
          <span className="whitespace-nowrap">
            <i className="fa-regular fa-clock mr-1.5" />
            {formatValidity(alert, now)}
          </span>
          {relevant.length > 1 && (
            <span className="mt-1 text-white/50">{(index % relevant.length) + 1} / {relevant.length}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export const ServiceAlerts = memo(ServiceAlertsComponent);
