import { useState, useEffect, useRef } from "react";
import { useDataContext } from "@/context/DataContext";
import { Clock, MapPin, AlertTriangle, Moon, Wrench, Info, ArrowRight, Bell, BellRing } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { DepartureTracker } from "@/components/DepartureTracker";
import { getActiveTripIds, requestPushPermission } from "@/utils/notificationService";
import type { Departure } from "@/types/pid";

/* ── types ─────────────────────────────────────────────────── */

export interface MobileStationDef {
  key: string;
  name: string;
  direction: string;
  simpleName: string;
  walkMinutes: number;
}

export interface MobileBuildingTheme {
  headerBg: string;         // CSS for header background
  headerOverlay: string;    // CSS class for overlay
  accentColor: string;      // hex for accents
  tabBorder: string;        // tailwind border class
  tabActive: string;        // tailwind text class
  dotActive: string;        // tailwind bg class
  logoSrc?: string;         // override logo (shown alongside school logo)
  dateColor?: string;       // tailwind text class for date
}

export interface MetroInfoDef {
  stationKey: string;
  name: string;
  line: "A" | "B" | "C";
}

export interface MobileBuildingDef {
  title: string;
  stations: MobileStationDef[];
  theme?: MobileBuildingTheme;
  metro?: MetroInfoDef[];
}

const DEFAULT_THEME: MobileBuildingTheme = {
  headerBg: "url('/pictures/b1729e07-3fec-4e02-8298-7438ffe7f242.png')",
  headerOverlay: "bg-blue-900/85",
  accentColor: "#2563eb",
  tabBorder: "border-blue-600",
  tabActive: "text-blue-700",
  dotActive: "bg-blue-500",
  dateColor: "text-blue-200",
};

/* ── helpers ────────────────────────────────────────────────── */

function getRouteColor(routeType: number): string {
  switch (routeType) {
    case 0: return "bg-red-100 text-red-800";
    case 3: return "bg-blue-100 text-blue-800";
    case 1: return "bg-green-100 text-green-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getStihani(departure: Departure, walkMinutes: number, currentTime: number): { text: string; color: string } | null {
  const timeToArrival = departure.arrival_timestamp - currentTime;
  const walkSeconds = walkMinutes * 60;

  if (timeToArrival < walkSeconds) return { text: "Nestíháš", color: "text-red-600" };
  if (timeToArrival < walkSeconds + 60) return { text: "Běž!", color: "text-orange-500" };
  if (timeToArrival < walkSeconds + 120) return { text: "Stíháš", color: "text-green-600" };
  return null;
}

function getDelayBadge(delay: number) {
  const minutes = Math.floor(delay / 60);
  if (minutes <= 0) return { text: "Včas", cls: "bg-green-100 text-green-800" };
  if (delay <= 60) return { text: `+${minutes} min`, cls: "bg-yellow-100 text-yellow-800" };
  return { text: `+${minutes} min`, cls: "bg-red-100 text-red-800" };
}

/* ── direction display (metro icons etc) ───────────────────── */

const METRO_ICON_SIZE = "1.1rem";

function getDirectionDisplay(departure: Departure) {
  const routeNumber = departure.route_short_name;
  const headsign = departure.headsign;
  const hl = headsign?.toLowerCase() || "";

  if (routeNumber === "174" && headsign && hl.includes("luka")) {
    return (
      <span className="flex items-center gap-1">
        <span>{headsign}</span>
        <img src="/pictures/metroB.svg" alt="B" style={{ width: METRO_ICON_SIZE, height: METRO_ICON_SIZE }} className="inline-block" />
        <ArrowRight className="w-4 h-4 text-blue-600" />
        <span className="text-orange-600 font-medium">301/352</span>
      </span>
    );
  }

  if (headsign && hl.includes("dejvická")) {
    return (
      <span className="flex items-center gap-1">
        <span>{headsign}</span>
        <img src="/pictures/metroA.svg" alt="A" style={{ width: METRO_ICON_SIZE, height: METRO_ICON_SIZE }} className="inline-block" />
      </span>
    );
  }

  if (headsign && hl.includes("zličín") && !hl.includes("obchodní centrum") && !hl.includes("obchodního centra")) {
    return (
      <span className="flex items-center gap-1">
        <span>{headsign}</span>
        <img src="/pictures/metroB.svg" alt="B" style={{ width: METRO_ICON_SIZE, height: METRO_ICON_SIZE }} className="inline-block" />
      </span>
    );
  }

  if (headsign && hl.includes("nemocnice motol")) {
    return (
      <span className="flex items-center gap-1">
        <span>{headsign}</span>
        <img src="/pictures/metroA.svg" alt="A" style={{ width: METRO_ICON_SIZE, height: METRO_ICON_SIZE }} className="inline-block" />
      </span>
    );
  }

  return headsign;
}

function isSchoolTram(departure: Departure, simpleName: string): boolean {
  const vn = departure.vehicle_number;
  return (vn === "8466" || vn === "8467") && simpleName.toLowerCase().includes("vozovna motol");
}

interface ServiceAlert { text: string; cls: string; }

function getServiceAlerts(departure: Departure, simpleName: string): ServiceAlert[] {
  const alerts: ServiceAlert[] = [];
  const hl = departure.headsign?.toLowerCase() || "";

  if (hl.includes("jen do") || hl.includes("pouze do"))
    alerts.push({ text: "Zkrácená jízda", cls: "bg-yellow-100 text-yellow-800" });

  if (departure.continues_as)
    alerts.push({
      text: `Pokračuje jako ${departure.continues_as}${departure.continues_direction ? " → " + departure.continues_direction : ""}`,
      cls: "bg-purple-100 text-purple-800",
    });

  if (departure.alert_hash === "canceled")
    alerts.push({ text: "Zrušeno", cls: "bg-red-100 text-red-800" });
  else if (departure.alert_hash)
    alerts.push({ text: "Výluka/Omezení", cls: "bg-blue-100 text-blue-800" });

  return alerts;
}

/* ── swipe detection ───────────────────────────────────────── */

function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const startX = useRef(0);
  const startY = useRef(0);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) onSwipeLeft();
        else onSwipeRight();
      }
    },
  };
}

/* ── departure card ────────────────────────────────────────── */

function MobileDepartureCard({
  departure, currentTime, walkMinutes, simpleName, onTap, hasNotification,
}: {
  departure: Departure; currentTime: number; walkMinutes: number; simpleName: string; onTap: () => void; hasNotification?: boolean;
}) {
  const timeToArrival = departure.arrival_timestamp - currentTime;
  const minutes = Math.floor(timeToArrival / 60);
  const stihani = getStihani(departure, walkMinutes, currentTime);
  const delay = departure.delay || 0;
  const delayInfo = getDelayBadge(delay);
  const isNight = departure.is_night;
  const isToDepot = departure.headsign?.toLowerCase().includes("vozovna") && !departure.headsign?.toLowerCase().includes("ústředn");
  const isApproaching = timeToArrival <= 120 && timeToArrival > 0;
  const schoolTram = isSchoolTram(departure, simpleName);
  const serviceAlerts = getServiceAlerts(departure, simpleName);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer active:bg-gray-50 transition-colors ${schoolTram ? "bg-[#EB5D43]/10 border-[#EB5D43]/30" : ""}`}
      onClick={onTap}
    >
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${getRouteColor(departure.route_type)}`}
        style={{ fontSize: departure.route_short_name.length > 2 ? "1rem" : "1.4rem" }}
      >
        {departure.route_short_name}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-900 text-base leading-tight truncate">
          {getDirectionDisplay(departure)}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{minutes > 0 ? `${minutes} min` : `${timeToArrival}s`}</span>
          {departure.current_stop && (
            <>
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 ml-1" />
              <span className="truncate">{departure.current_stop}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${delayInfo.cls}`}>{delayInfo.text}</span>
          {isApproaching && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-800">Blíží se</span>}
          {isNight && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 flex items-center gap-0.5"><Moon className="w-3 h-3" /> Noční</span>}
          {isToDepot && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800 flex items-center gap-0.5"><Wrench className="w-3 h-3" /> Vozovna</span>}
          {schoolTram && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded text-white flex items-center gap-0.5" style={{ backgroundColor: "#EB5D43" }}>
              <img src="/pictures/tramvaj.svg" alt="" className="w-3 h-3" style={{ filter: "brightness(0) invert(1)" }} /> Školní
            </span>
          )}
          {serviceAlerts.map((a, i) => <span key={i} className={`text-xs font-semibold px-2 py-0.5 rounded ${a.cls}`}>{a.text}</span>)}
          {departure.wheelchair_accessible && <i className="fas fa-wheelchair text-xs text-blue-500"></i>}
          {departure.air_conditioning && <i className="fas fa-snowflake text-xs text-blue-400"></i>}
        </div>
      </div>

      <div className="flex-shrink-0 text-right min-w-[4.5rem]">
        {hasNotification && (
          <Bell className="w-4 h-4 text-amber-500 inline-block mb-0.5" />
        )}
        {stihani ? (
          <div className={`text-xl font-extrabold leading-none ${stihani.color}`}>{stihani.text}</div>
        ) : (
          <div className="text-2xl font-extrabold text-gray-900 leading-none">
            {minutes} <span className="text-sm font-bold text-gray-400">min</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── metro header ──────────────────────────────────────────── */

function MetroHeader({ metro, accentColor }: { metro: MetroInfoDef[]; accentColor: string }) {
  const { getDeparturesForStation, time } = useDataContext();
  const nowSec = Math.floor((Date.now() + time.timeOffset) / 1000);

  const metroIcon: Record<string, string> = {
    A: "/pictures/metroA.svg",
    B: "/pictures/metroB.svg",
    C: "/pictures/metroC.svg",
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mt-3">
      {metro.map((m) => {
        const data = getDeparturesForStation(m.stationKey);
        const deps = data.departures.sort((a, b) => a.arrival_timestamp - b.arrival_timestamp);
        const next = deps[0];
        const nextMin = next ? Math.max(0, Math.ceil((next.arrival_timestamp - nowSec) / 60)) : null;

        let interval: number | null = null;
        if (deps.length >= 2) {
          const gaps: number[] = [];
          const count = Math.min(deps.length, 3);
          for (let i = 1; i < count; i++) gaps.push(deps[i].arrival_timestamp - deps[i - 1].arrival_timestamp);
          interval = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length / 60);
        }

        return (
          <div key={m.stationKey} className="flex items-center gap-1.5 text-sm">
            <img src={metroIcon[m.line]} alt={m.line} className="w-4 h-4" />
            <span className="text-white/80">{m.name}</span>
            {nextMin !== null ? (
              <span className="font-bold text-white">{nextMin} min</span>
            ) : (
              <span className="text-white/40">—</span>
            )}
            {interval !== null && (
              <span className="text-white/40 text-xs">/ {interval} min</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── main reusable component ───────────────────────────────── */

export function MobileDepartures({ building }: { building: MobileBuildingDef }) {
  // Lock body scroll on mobile pages
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, []);

  const { getDeparturesForStation, time, seasonalTheme } = useDataContext();
  const currentTime = time.currentTime;
  const timeOffset = time.timeOffset;
  const [nowSec, setNowSec] = useState(Math.floor((Date.now() + timeOffset) / 1000));
  const [stationIdx, setStationIdx] = useState(0);
  const [direction, setDirection] = useState(0);
  const [trackedDeparture, setTrackedDeparture] = useState<Departure | null>(null);
  const [notifiedTripIds, setNotifiedTripIds] = useState<Set<string>>(new Set());
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    try { return typeof Notification !== "undefined" ? Notification.permission : "unsupported"; } catch { return "unsupported"; }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setNowSec(Math.floor((Date.now() + timeOffset) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeOffset]);

  const station = building.stations[stationIdx] || building.stations[0];

  const goToStation = (idx: number) => {
    if (idx === stationIdx || idx < 0 || idx >= building.stations.length) return;
    setDirection(idx > stationIdx ? 1 : -1);
    setStationIdx(idx);
  };

  const swipe = useSwipe(
    () => goToStation(stationIdx + 1),
    () => goToStation(stationIdx - 1),
  );

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  const t = building.theme || DEFAULT_THEME;
  const logoPath = t.logoSrc || seasonalTheme.logoPath;

  // Load active notifications for this device only — single round-trip.
  useEffect(() => {
    getActiveTripIds().then(setNotifiedTripIds);
  }, [station.key, trackedDeparture]); // re-check when tracker closes

  const stationData = getDeparturesForStation(station.key);
  const departures = stationData.departures.slice(0, 10);
  const loading = stationData.loading;
  const error = stationData.error;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-amber-50 flex flex-col overflow-hidden" style={{ height: "100dvh" }}>

      {/* Header */}
      <div
        className="text-white shadow-lg relative"
        style={{
          backgroundImage: t.headerBg.startsWith("url") ? t.headerBg : undefined,
          backgroundColor: !t.headerBg.startsWith("url") ? t.headerBg : undefined,
          backgroundSize: "auto", backgroundPosition: "center", backgroundRepeat: "repeat",
        }}
      >
        <div className={`absolute inset-0 ${t.headerOverlay}`} />
        <div
          className="relative z-10 px-5 pb-5"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {t.logoSrc && <img src={t.logoSrc} alt="" className="h-10 object-contain" />}
              <img src={seasonalTheme.logoPath} alt="SPŠD" className="h-10 object-contain" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold leading-none">
                {currentTime.toLocaleTimeString("cs-CZ")}
              </div>
              <div className={`text-sm mt-1 ${t.dateColor || "text-blue-200"}`}>
                {currentTime.toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-black leading-tight">{building.title}</h1>
          <div className={`text-base mt-0.5 ${t.dateColor || "text-blue-200"}`}>{station.name} — {station.direction}</div>

          {/* Metro info */}
          {building.metro && building.metro.length > 0 && (
            <MetroHeader metro={building.metro} accentColor={t.accentColor} />
          )}
        </div>
      </div>

      {/* Notification permission banner */}
      {notifPermission !== "granted" && (
        <button
          onClick={async () => {
            try {
              if (typeof Notification === "undefined") {
                const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
                if (isIOS) {
                  alert("Oznámení fungují jen přes HTTPS.\n\nPřidej si appku z produkční domény (ne localhost).");
                }
                return;
              }

              const { registerFirebaseSW } = await import("@/utils/firebase");
              await registerFirebaseSW();
              await new Promise(r => setTimeout(r, 500));

              const permission = await Notification.requestPermission();
              setNotifPermission(permission);

              if (permission === "granted") {
                await requestPushPermission();
              }
            } catch (e: any) {
              alert("Chyba: " + e.message);
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-bold active:bg-blue-700 shadow-md"
        >
          <BellRing className="w-4 h-4" />
          Zapnout oznámení o příjezdech
        </button>
      )}

      {/* Direction tabs */}
      <div className={`bg-white/95 shadow-sm border-b-4 ${t.tabBorder} flex-shrink-0`}>
        <div className="flex">
          {building.stations.map((s, idx) => (
            <button
              key={idx}
              onClick={() => goToStation(idx)}
              className={`flex-1 min-w-0 px-1 py-2 text-center transition-colors relative ${
                idx === stationIdx ? `${t.tabActive} font-bold` : "text-gray-400 active:text-gray-600"
              }`}
            >
              <div className="text-[11px] truncate leading-tight font-semibold">{s.direction}</div>
              {idx === stationIdx && <div className="absolute bottom-0 left-1 right-1 h-1 rounded-t-full" style={{ backgroundColor: t.accentColor }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Departures */}
      <div className="flex-1 px-3 py-2 overflow-hidden flex flex-col min-h-0" {...swipe}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={stationIdx}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            {error && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-10 text-center">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">{error}</p>
              </div>
            )}

            {!error && departures.length === 0 && !loading && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-10 text-center">
                <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium text-lg">Žádné odjezdy do 30 min</p>
              </div>
            )}

            {loading && departures.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-10 text-center">
                <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400">Načítání odjezdů...</p>
              </div>
            )}

            {departures.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-y-auto flex-1 flex flex-col">
                {departures.map((dep) => (
                  <MobileDepartureCard
                    key={`${dep.route_short_name}-${dep.trip_id}-${dep.departure_timestamp}`}
                    departure={dep}
                    currentTime={nowSec}
                    walkMinutes={station.walkMinutes}
                    simpleName={station.simpleName}
                    onTap={() => setTrackedDeparture(dep)}
                    hasNotification={!!dep.trip_id && notifiedTripIds.has(dep.trip_id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-center gap-1.5 mt-2">
          {building.stations.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all ${idx === stationIdx ? `w-5 ${t.dotActive}` : "w-1.5 bg-gray-300"}`}
            />
          ))}
        </div>
      </div>

      {/* Departure tracker sheet */}
      {trackedDeparture && (
        <DepartureTracker
          departure={trackedDeparture}
          currentTime={nowSec}
          stationName={station.name}
          walkMinutes={station.walkMinutes}
          onClose={() => setTrackedDeparture(null)}
        />
      )}
    </div>
  );
}
