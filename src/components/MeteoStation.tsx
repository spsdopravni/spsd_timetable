import { memo, useState, useEffect } from "react";
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  CloudRain,
  Navigation,
  Waves,
  TrendingUp,
  TrendingDown,
  Minus,
  Snowflake,
  Flame,
  Umbrella,
} from "lucide-react";
import { useMeteoStation, type Trend, type WeatherAlert } from "@/hooks/useMeteoStation";

/* ── helpers ───────────────────────────────────────────────── */

function windDirectionLabel(kompas: string | null): string {
  if (!kompas) return "—";
  const map: Record<string, string> = {
    N: "S", NNE: "SSV", NE: "SV", ENE: "VSV",
    E: "V", ESE: "VJV", SE: "JV", SSE: "JJV",
    S: "J", SSW: "JJZ", SW: "JZ", WSW: "ZJZ",
    W: "Z", WNW: "ZSZ", NW: "SZ", NNW: "SSZ",
  };
  return map[kompas] ?? kompas;
}

/**
 * Barva teploty. Pruh sedí na světlém podkladu jako karty odjezdů, takže
 * neonové odstíny z tmavé varianty by na něm nebyly čitelné. Na akcích
 * (bikefest, makerfaire) zůstává tmavé pozadí — proto dvě sady.
 */
function temperatureColor(temp: number | null, onDark = false): string {
  if (temp === null) return "text-gray-400";
  if (onDark) {
    if (temp <= -10) return "text-blue-400";
    if (temp <= 0) return "text-blue-300";
    if (temp <= 10) return "text-cyan-400";
    if (temp <= 20) return "text-emerald-400";
    if (temp <= 30) return "text-amber-400";
    return "text-red-400";
  }
  if (temp <= -10) return "text-blue-700";
  if (temp <= 0) return "text-blue-600";
  if (temp <= 10) return "text-sky-700";
  if (temp <= 20) return "text-emerald-700";
  if (temp <= 30) return "text-amber-600";
  return "text-red-600";
}

function val(v: number | null, decimals = 1): string {
  if (v === null) return "—";
  return v.toFixed(decimals);
}

/* ── trend arrow ───────────────────────────────────────────── */

function TrendArrow({ trend, onDark = false, className = "" }: { trend: Trend; onDark?: boolean; className?: string }) {
  const muted = onDark ? "text-white/20" : "text-gray-300";
  const up = onDark ? "text-red-400" : "text-red-600";
  const down = onDark ? "text-blue-400" : "text-blue-600";
  if (!trend || trend === "stable") return <Minus className={`w-4 h-4 ${muted} ${className}`} />;
  if (trend === "up") return <TrendingUp className={`w-4 h-4 ${up} ${className}`} />;
  return <TrendingDown className={`w-4 h-4 ${down} ${className}`} />;
}

/* ── alert icon ────────────────────────────────────────────── */

function AlertIcon({ alert, size = "w-6 h-6" }: { alert: WeatherAlert; size?: string }) {
  const color = alert.severity === "danger" ? "text-red-300" : "text-amber-300";
  const cls = `${size} ${color}`;
  switch (alert.type) {
    case "frost": return <Snowflake className={cls} />;
    case "heat": return <Flame className={cls} />;
    case "wind": return <Wind className={cls} />;
    case "rain": return <Umbrella className={cls} />;
    default: return <Wind className={cls} />;
  }
}

/* ── alert banner with rotation ────────────────────────────── */

function AlertBannerRotating({ alerts }: { alerts: WeatherAlert[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (alerts.length <= 1) return;

    const interval = setInterval(() => {
      // fade out
      setVisible(false);

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % alerts.length);
        // fade in
        setVisible(true);
      }, 400);
    }, 5000);

    return () => clearInterval(interval);
  }, [alerts.length]);

  // Reset index if alerts change
  useEffect(() => {
    setIndex(0);
    setVisible(true);
  }, [alerts.length]);

  if (alerts.length === 0) return null;

  const alert = alerts[index % alerts.length];
  const isDanger = alert.severity === "danger";

  return (
    <div className={`relative overflow-hidden border-b border-white/10 ${isDanger ? "bg-red-900/60" : "bg-amber-900/50"}`}>
      <div className="relative flex items-center justify-center gap-4 py-2 px-6">
        <div
          className={`flex items-center gap-3 transition-all duration-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
          style={{ transition: "opacity 0.4s ease, transform 0.4s ease" }}
        >
          <AlertIcon alert={alert} size="w-6 h-6" />
          <span className={`text-lg font-bold tracking-wide ${isDanger ? "text-red-100" : "text-amber-100"}`}>
            {alert.message}
          </span>
        </div>

        {/* dot indicators */}
        {alerts.length > 1 && (
          <div className="absolute right-4 flex items-center gap-1.5">
            {alerts.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === index % alerts.length
                    ? (isDanger ? "bg-red-300 w-3" : "bg-amber-300 w-3")
                    : "bg-white/25"
                }`}
                style={{ borderRadius: "999px" }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── single metric ─────────────────────────────────────────── */

type Variant = "default" | "bikefest" | "makerfaire";

const VARIANT_ACCENT: Record<Exclude<Variant, "default">, { hex: string; rgb: string }> = {
  bikefest: { hex: "#FDD835", rgb: "253, 216, 53" },
  makerfaire: { hex: "#F03553", rgb: "240, 53, 83" },
};

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  accent?: string;
  sub?: string;
  trend?: Trend;
  variant?: Variant;
}

function Metric({ icon, label, value, unit, accent = "", sub, trend, variant = "default" }: MetricProps) {
  const isEvent = variant !== "default";
  const eventAccent = isEvent ? VARIANT_ACCENT[variant] : null;

  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <div className="flex-shrink-0 self-center" style={eventAccent ? { color: eventAccent.hex } : undefined}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide leading-tight truncate text-white/55">
          {label}
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className={`font-bold leading-tight tabular-nums ${accent || "text-white"}`}
            style={{ fontSize: "clamp(1.4rem, 2.6vh, 2rem)" }}
          >
            {value}
          </span>
          <span className="text-sm font-medium text-white/45">{unit}</span>
          {trend && <TrendArrow trend={trend} onDark />}
        </div>
        {sub && (
          <div className="text-xs leading-tight truncate text-white/45">{sub}</div>
        )}
      </div>
    </div>
  );
}

/* ── main component ────────────────────────────────────────── */

interface MeteoStationProps {
  variant?: Variant;
}

function MeteoStationComponent({ variant = "default" }: MeteoStationProps) {
  const { data, extras, connected, available } = useMeteoStation();

  // On HTTPS (Vercel) — meteostation not reachable, hide completely
  if (!available) return null;

  const isEvent = variant !== "default";
  const eventAccent = isEvent ? VARIANT_ACCENT[variant] : null;
  const hasData = data.teplota !== null;

  if (!hasData) {
    return (
      <div
        className={`w-full ${isEvent ? "" : "bg-blue-900 border-b-4 border-blue-600"}`}
        style={eventAccent ? { background: "#1a1a1a", borderTop: `3px solid ${eventAccent.hex}`, borderBottom: `3px solid ${eventAccent.hex}` } : undefined}
      >
        <div className="flex items-center justify-center gap-3 py-4 px-6">
          <div
            className={`w-3 h-3 rounded-full animate-pulse ${isEvent ? "" : "bg-blue-300"}`}
            style={eventAccent ? { background: eventAccent.hex } : undefined}
          />
          <span className={`text-lg ${isEvent ? "text-white/70" : "text-white/60"}`}>
            Meteostanice — načítání dat...
          </span>
        </div>
      </div>
    );
  }

  const isRaining = (data.srazkyZaMin ?? 0) > 0;
  const feelsLikeDiff = extras.feelsLike !== null && data.teplota !== null
    ? Math.abs(extras.feelsLike - data.teplota) >= 1
    : false;

  const alerts = extras.alerts;

  const iconStyle = eventAccent ? { color: eventAccent.hex } : undefined;
  // Na světlém pruhu drží ikony jeden modrý tón — sedm neonových odstínů
  // z tmavé varianty tu působilo jako jiná aplikace. Barvu dostane jen to,
  // co něco znamená (déšť, teplota).
  const iconCls = (defaultCls: string) => isEvent ? "w-7 h-7" : defaultCls;

  return (
    <div
      className={`w-full ${isEvent ? "" : `border-b-4 border-blue-600 ${connected ? "bg-blue-900" : "bg-blue-950"}`}`}
      style={eventAccent ? { background: "#1a1a1a", borderTop: `3px solid ${eventAccent.hex}`, borderBottom: `3px solid ${eventAccent.hex}` } : undefined}
    >

      {/* ── alert banner (rotuje po jednom) ───────────── */}
      <AlertBannerRotating alerts={alerts} />

      <div className="flex items-center gap-6 py-3 px-6" style={{ minHeight: "5rem" }}>

        {/* ── teplota (velká, výrazná) ─────────────────── */}
        <div
          className="flex items-center gap-3 pr-6 flex-shrink-0"
          style={eventAccent ? { borderRight: `1px solid rgba(${eventAccent.rgb}, 0.35)` } : { borderRight: "1px solid rgba(255,255,255,0.18)" }}
        >
          <Thermometer className={`w-10 h-10 ${temperatureColor(data.teplota, true)}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-white/55">Teplota</span>
              <TrendArrow trend={extras.tempTrend} onDark />
            </div>
            <div className={`font-extrabold leading-none tabular-nums ${temperatureColor(data.teplota, true)}`} style={{ fontSize: "clamp(2.2rem, 4vh, 3.2rem)" }}>
              {val(data.teplota)}
              <span className={`font-bold ml-0.5 text-white/50`} style={{ fontSize: "clamp(1rem, 2vh, 1.5rem)" }}>&#176;C</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {feelsLikeDiff && (
                <span className="text-xs text-white/55">
                  Pocitově {val(extras.feelsLike)}&#176;C
                </span>
              )}
              {extras.tempMin !== null && extras.tempMax !== null && (
                <span className="text-xs tabular-nums text-white/40">
                  {val(extras.tempMin)}&#176; / {val(extras.tempMax)}&#176;
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── metriky ──────────────────────────────────── */}
        <div className="flex-1 grid grid-cols-6 gap-x-5">
          <Metric
            variant={variant}
            icon={<Droplets className={iconCls("w-6 h-6 text-blue-300")} style={iconStyle} />}
            label="Vlhkost"
            value={val(data.vlhkost, 0)}
            unit="%"
            accent=""
            sub={data.absolutniVlhkost !== null ? `${val(data.absolutniVlhkost, 1)} g/m³` : undefined}
          />

          <Metric
            variant={variant}
            icon={<Gauge className={iconCls("w-6 h-6 text-blue-300")} style={iconStyle} />}
            label="Tlak"
            value={val(data.tlakMoreHladina, 0)}
            unit="hPa"
            accent=""
            trend={extras.pressureTrend}
          />

          <Metric
            variant={variant}
            icon={<Wind className={iconCls("w-6 h-6 text-blue-300")} style={iconStyle} />}
            label="Vítr"
            value={val(data.prumernaRychlostVetruKmh)}
            unit="km/h"
            accent=""
            sub={data.beaufort ?? undefined}
          />

          <Metric
            variant={variant}
            icon={
              <Navigation
                className={`${iconCls("text-blue-300")} w-6 h-6 transition-transform duration-700`}
                style={{
                  ...(iconStyle ?? {}),
                  transform: data.smerVetruStupne !== null
                    ? `rotate(${data.smerVetruStupne + 180}deg)`
                    : undefined,
                }}
              />
            }
            label="Směr větru"
            value={windDirectionLabel(data.smerVetruKompas)}
            unit={data.smerVetruStupne !== null ? `${data.smerVetruStupne.toFixed(0)}°` : ""}
            accent=""
          />

          <Metric
            variant={variant}
            icon={<CloudRain className={iconCls(`w-6 h-6 ${isRaining ? "text-sky-200" : "text-blue-300"}`)} style={iconStyle} />}
            label="Srážky dnes"
            value={val(data.srazkyZaDen, 1)}
            unit="mm"
            accent={isRaining ? "text-sky-200" : ""}
            sub={isRaining ? `${val(data.srazkyZaMin, 2)} mm/min` : undefined}
          />

          <Metric
            variant={variant}
            icon={<Waves className={iconCls("w-6 h-6 text-blue-300")} style={iconStyle} />}
            label="Rosný bod"
            value={val(data.rosnyBod)}
            unit="&#176;C"
            accent=""
          />
        </div>

        {/* ── status ───────────────────────────────────── */}
        <div
          className="flex-shrink-0 pl-6"
          style={eventAccent ? { borderLeft: `1px solid rgba(${eventAccent.rgb}, 0.35)` } : { borderLeft: "1px solid rgba(255,255,255,0.18)" }}
        >
          {/* Jen tečka a stav. Čas poslední aktualizace vedle velkých hodin
              v hlavičce působil jako druhý, konkurenční čas — a nikdo ho
              na tabuli nečte. */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${!isEvent && connected ? "bg-emerald-400" : !isEvent && !connected ? "bg-red-400" : ""}`}
              style={eventAccent ? { background: connected ? eventAccent.hex : "#ef4444" } : undefined}
            />
            <span
              className={`text-xs font-medium ${!isEvent ? (connected ? "text-emerald-300" : "text-red-300") : ""}`}
              style={eventAccent ? { color: connected ? eventAccent.hex : "#ef4444" } : undefined}
            >
              {connected ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const MeteoStation = memo(MeteoStationComponent);
