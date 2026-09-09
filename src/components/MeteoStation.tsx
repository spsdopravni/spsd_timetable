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

function temperatureColor(temp: number | null): string {
  if (temp === null) return "text-gray-400";
  if (temp <= -10) return "text-blue-400";
  if (temp <= 0) return "text-blue-300";
  if (temp <= 10) return "text-cyan-400";
  if (temp <= 20) return "text-emerald-400";
  if (temp <= 30) return "text-amber-400";
  return "text-red-400";
}

function val(v: number | null, decimals = 1): string {
  if (v === null) return "—";
  return v.toFixed(decimals);
}

/* ── trend arrow ───────────────────────────────────────────── */

function TrendArrow({ trend, className = "" }: { trend: Trend; className?: string }) {
  if (!trend || trend === "stable") {
    return <Minus className={`w-4 h-4 text-white/20 ${className}`} />;
  }
  if (trend === "up") {
    return <TrendingUp className={`w-4 h-4 text-red-400 ${className}`} />;
  }
  return <TrendingDown className={`w-4 h-4 text-blue-400 ${className}`} />;
}

/* ── alert icon ────────────────────────────────────────────── */

function AlertIcon({ alert, size = "w-6 h-6" }: { alert: WeatherAlert; size?: string }) {
  const color = alert.severity === "danger" ? "text-red-300" : "text-yellow-300";
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
    <div className={`relative overflow-hidden ${isDanger ? "bg-gradient-to-r from-red-900/50 via-red-800/40 to-red-900/50" : "bg-gradient-to-r from-amber-900/30 via-yellow-800/25 to-amber-900/30"}`}>
      {/* animated pulse bg */}
      <div className={`absolute inset-0 ${isDanger ? "bg-red-600/10" : "bg-yellow-500/5"} animate-pulse`} />

      <div className="relative flex items-center justify-center gap-4 py-2.5 px-6">
        <div
          className={`flex items-center gap-3 transition-all duration-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
          style={{ transition: "opacity 0.4s ease, transform 0.4s ease" }}
        >
          <AlertIcon alert={alert} size="w-7 h-7" />
          <span className={`text-xl font-bold tracking-wide ${isDanger ? "text-red-200" : "text-yellow-200"}`}>
            {alert.message}
          </span>
          <AlertIcon alert={alert} size="w-7 h-7" />
        </div>

        {/* dot indicators */}
        {alerts.length > 1 && (
          <div className="absolute right-4 flex items-center gap-1.5">
            {alerts.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === index % alerts.length
                    ? (isDanger ? "bg-red-300 w-3" : "bg-yellow-300 w-3")
                    : "bg-white/20"
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

function Metric({ icon, label, value, unit, accent = "text-white", sub, trend, variant = "default" }: MetricProps) {
  const isEvent = variant !== "default";
  const eventAccent = isEvent ? VARIANT_ACCENT[variant] : null;
  return (
    <div className="flex items-center gap-4 min-w-0">
      <div
        className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${isEvent ? "" : "bg-white/10"}`}
        style={eventAccent ? { background: `rgba(${eventAccent.rgb}, 0.12)`, border: `1px solid rgba(${eventAccent.rgb}, 0.35)` } : undefined}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className={`text-sm leading-tight truncate ${isEvent ? "text-white/70" : "text-white/50"}`}>{label}</div>
        <div className="flex items-center gap-1">
          <span
            className={`font-bold leading-tight ${isEvent ? "text-white" : accent}`}
            style={{ fontSize: "clamp(1.4rem, 2.5vh, 2rem)" }}
          >
            {value}
            <span className={`text-base font-normal ml-1 ${isEvent ? "text-white/50" : "text-white/40"}`}>{unit}</span>
          </span>
          {trend && <TrendArrow trend={trend} />}
        </div>
        {sub && <div className={`text-xs leading-tight ${isEvent ? "text-white/50" : "text-white/30"}`}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── main component ────────────────────────────────────────── */

interface MeteoStationProps {
  variant?: Variant;
}

function MeteoStationComponent({ variant = "default" }: MeteoStationProps) {
  const { data, extras, connected, available, lastUpdate } = useMeteoStation();

  // On HTTPS (Vercel) — meteostation not reachable, hide completely
  if (!available) return null;

  const isEvent = variant !== "default";
  const eventAccent = isEvent ? VARIANT_ACCENT[variant] : null;
  const hasData = data.teplota !== null;

  if (!hasData) {
    return (
      <div
        className={`w-full ${isEvent ? "" : "bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-white/10"}`}
        style={eventAccent ? { background: "#1a1a1a", borderTop: `3px solid ${eventAccent.hex}`, borderBottom: `3px solid ${eventAccent.hex}` } : undefined}
      >
        <div className="flex items-center justify-center gap-3 py-4 px-6">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={eventAccent ? { background: eventAccent.hex } : undefined}
          />
          <span className={`text-xl ${isEvent ? "text-white/70" : "text-white/50"}`}>
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
  const iconCls = (defaultCls: string) => isEvent ? "w-7 h-7" : defaultCls;

  return (
    <div
      className={`w-full shadow-lg ${isEvent ? "" : `border-b border-white/10 ${connected ? "bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800" : "bg-gradient-to-r from-slate-800 via-red-950/30 to-slate-800"}`}`}
      style={eventAccent ? { background: "#1a1a1a", borderTop: `3px solid ${eventAccent.hex}`, borderBottom: `3px solid ${eventAccent.hex}` } : undefined}
    >

      {/* ── alert banner (rotuje po jednom) ───────────── */}
      <AlertBannerRotating alerts={alerts} />

      <div className="flex items-center gap-6 py-3 px-6" style={{ minHeight: "5rem" }}>

        {/* ── teplota (velká, výrazná) ─────────────────── */}
        <div
          className="flex items-center gap-3 pr-6 flex-shrink-0"
          style={eventAccent ? { borderRight: `1px solid rgba(${eventAccent.rgb}, 0.35)` } : { borderRight: "1px solid rgba(255,255,255,0.15)" }}
        >
          <Thermometer className={`w-12 h-12 ${temperatureColor(data.teplota)}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm leading-tight ${isEvent ? "text-white/70" : "text-white/50"}`}>Teplota</span>
              <TrendArrow trend={extras.tempTrend} />
            </div>
            <div className={`font-extrabold leading-none ${temperatureColor(data.teplota)}`} style={{ fontSize: "clamp(2.2rem, 4vh, 3.2rem)" }}>
              {val(data.teplota)}
              <span className={`font-bold ml-0.5 ${isEvent ? "text-white/60" : "text-white/40"}`} style={{ fontSize: "clamp(1rem, 2vh, 1.5rem)" }}>&#176;C</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {feelsLikeDiff && (
                <span className={`text-xs ${isEvent ? "text-white/60" : "text-white/40"}`}>
                  Pocitově {val(extras.feelsLike)}&#176;C
                </span>
              )}
              {extras.tempMin !== null && extras.tempMax !== null && (
                <span className={`text-xs ${isEvent ? "text-white/50" : "text-white/30"}`}>
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
            icon={<Droplets className={iconCls("w-7 h-7 text-blue-400")} style={iconStyle} />}
            label="Vlhkost"
            value={val(data.vlhkost, 0)}
            unit="%"
            accent="text-blue-300"
            sub={data.absolutniVlhkost !== null ? `${val(data.absolutniVlhkost, 1)} g/m³` : undefined}
          />

          <Metric
            variant={variant}
            icon={<Gauge className={iconCls("w-7 h-7 text-violet-400")} style={iconStyle} />}
            label="Tlak"
            value={val(data.tlakMoreHladina, 0)}
            unit="hPa"
            accent="text-violet-300"
            trend={extras.pressureTrend}
          />

          <Metric
            variant={variant}
            icon={<Wind className={iconCls("w-7 h-7 text-cyan-400")} style={iconStyle} />}
            label="Vítr"
            value={val(data.prumernaRychlostVetruKmh)}
            unit="km/h"
            accent="text-cyan-300"
            sub={data.beaufort ?? undefined}
          />

          <Metric
            variant={variant}
            icon={
              <Navigation
                className={`${iconCls("text-teal-400")} w-7 h-7 transition-transform duration-700`}
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
            accent="text-teal-300"
          />

          <Metric
            variant={variant}
            icon={<CloudRain className={iconCls(`w-7 h-7 ${isRaining ? "text-blue-400" : "text-sky-400"}`)} style={iconStyle} />}
            label="Srážky dnes"
            value={val(data.srazkyZaDen, 1)}
            unit="mm"
            accent={isRaining ? "text-blue-300" : "text-sky-300"}
            sub={isRaining ? `${val(data.srazkyZaMin, 2)} mm/min` : undefined}
          />

          <Metric
            variant={variant}
            icon={<Waves className={iconCls("w-7 h-7 text-emerald-400")} style={iconStyle} />}
            label="Rosný bod"
            value={val(data.rosnyBod)}
            unit="&#176;C"
            accent="text-emerald-300"
          />
        </div>

        {/* ── status ───────────────────────────────────── */}
        <div
          className="flex-shrink-0 pl-6"
          style={eventAccent ? { borderLeft: `1px solid rgba(${eventAccent.rgb}, 0.35)` } : { borderLeft: "1px solid rgba(255,255,255,0.15)" }}
        >
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${!isEvent && connected ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : !isEvent && !connected ? "bg-red-500" : ""}`}
                style={eventAccent ? { background: connected ? eventAccent.hex : "#ef4444", boxShadow: connected ? `0 0 8px rgba(${eventAccent.rgb}, 0.6)` : undefined } : undefined}
              />
              <span
                className={`text-sm font-medium ${!isEvent ? (connected ? "text-green-400/70" : "text-red-400/70") : ""}`}
                style={eventAccent ? { color: connected ? eventAccent.hex : "#ef4444" } : undefined}
              >
                {connected ? "Online" : "Offline"}
              </span>
            </div>
            {lastUpdate && (
              <span className={`text-xs ${isEvent ? "text-white/50" : "text-white/25"}`}>
                {lastUpdate.toLocaleTimeString("cs-CZ")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const MeteoStation = memo(MeteoStationComponent);
