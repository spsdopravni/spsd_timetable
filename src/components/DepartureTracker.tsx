import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bell, BellOff, BellRing, MapPin, Clock, Wind, Accessibility,
  Snowflake, Wifi, Usb, BatteryCharging, Bike,
} from "lucide-react";
import { getTripStops, type TripStop } from "@/utils/pidApi";
import { saveNotification, getActiveNotifications, requestPushPermission } from "@/utils/notificationService";
import type { Departure } from "@/types/pid";

/* ── local notification (confirmation) ─────────────────────── */

async function sendLocalNotification(title: string, body: string) {
  try {
    const options = {
      body,
      icon: "/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png",
      badge: "/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png",
      image: "/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png",
      vibrate: [200, 100, 200],
      tag: "spsd-confirm-" + Date.now(),
      renotify: true,
      silent: false,
    };
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
      return;
    }
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, options);
    }
  } catch {}
}

/* ── helpers ────────────────────────────────────────────────── */

function getVehicleType(routeType: number): string {
  switch (routeType) { case 0: return "Tramvaj"; case 1: return "Metro"; case 2: return "Vlak"; case 3: return "Autobus"; default: return "Spoj"; }
}

function getRouteAccent(routeType: number): string {
  switch (routeType) { case 0: return "#dc2626"; case 3: return "#2563eb"; case 1: return "#16a34a"; default: return "#6b7280"; }
}

/* ── vehicle features ──────────────────────────────────────── */

function VehicleFeatures({ departure }: { departure: Departure }) {
  const features: { icon: React.ReactNode; label: string }[] = [];
  if (departure.air_conditioning) features.push({ icon: <Snowflake className="w-4 h-4" />, label: "Klima" });
  if (departure.wheelchair_accessible) features.push({ icon: <Accessibility className="w-4 h-4" />, label: "Bezbariérové" });
  if (departure.wifi) features.push({ icon: <Wifi className="w-4 h-4" />, label: "WiFi" });
  if (departure.usb_charging) features.push({ icon: <Usb className="w-4 h-4" />, label: "USB" });
  if (departure.bike_rack) features.push({ icon: <Bike className="w-4 h-4" />, label: "Kola" });
  if (departure.low_floor) features.push({ icon: <BatteryCharging className="w-4 h-4" />, label: "Nízkopodlažní" });
  if (features.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5">
          {f.icon}<span>{f.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── route diagram ─────────────────────────────────────────── */

function RouteDiagram({
  stops,
  currentStopId,
  targetStopId,
  accentColor,
  notifyStopId,
  onStopTap,
}: {
  stops: TripStop[];
  currentStopId: string | null;
  targetStopId: string;
  accentColor: string;
  notifyStopId: string | null;
  onStopTap: (stop: TripStop) => void;
}) {
  if (stops.length === 0) return null;

  const currentIdx = currentStopId ? stops.findIndex(s => s.stopId === currentStopId) : -1;
  const targetIdx = stops.findIndex(s => s.stopId === targetStopId);

  return (
    <div className="mt-4">
      <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5" />
        Trasa — klikni na zastávku pro upozornění
      </div>
      <div className="relative max-h-[30vh] overflow-y-auto rounded-2xl bg-gray-50 p-3">
        {stops.map((stop, idx) => {
          const isPast = currentIdx >= 0 && idx <= currentIdx;
          const isCurrent = currentIdx >= 0 && idx === currentIdx;
          const isTarget = stop.stopId === targetStopId;
          const isNotify = stop.stopId === notifyStopId;

          return (
            <div
              key={`${stop.stopId}-${idx}`}
              className="flex items-start gap-3 cursor-pointer active:bg-gray-100 rounded-lg -mx-1 px-1 py-0.5"
              onClick={() => onStopTap(stop)}
            >
              {/* Timeline */}
              <div className="flex flex-col items-center flex-shrink-0 w-5">
                {/* Line above */}
                {idx > 0 && (
                  <div
                    className="w-0.5 h-3"
                    style={{ backgroundColor: isPast ? accentColor : "#d1d5db" }}
                  />
                )}
                {/* Dot */}
                <div
                  className={`rounded-full flex-shrink-0 flex items-center justify-center ${
                    isCurrent ? "w-5 h-5 shadow-md" :
                    isTarget ? "w-4 h-4 border-2" :
                    isNotify ? "w-4 h-4 border-2" :
                    "w-2.5 h-2.5"
                  }`}
                  style={{
                    backgroundColor: isCurrent ? accentColor :
                      isTarget ? "white" :
                      isNotify ? "#fbbf24" :
                      isPast ? accentColor : "#d1d5db",
                    borderColor: isTarget ? accentColor : isNotify ? "#f59e0b" : undefined,
                  }}
                >
                  {isCurrent && <i className="fa-solid fa-train-tram text-white text-[6px]" />}
                </div>
                {/* Line below */}
                {idx < stops.length - 1 && (
                  <div
                    className="w-0.5 h-3"
                    style={{ backgroundColor: isPast && idx < currentIdx ? accentColor : "#d1d5db" }}
                  />
                )}
              </div>

              {/* Stop info */}
              <div className={`flex-1 min-w-0 ${idx === 0 || idx === stops.length - 1 ? "" : ""}`}>
                <div className={`text-sm leading-tight ${
                  isCurrent ? "font-bold text-gray-900" :
                  isTarget ? "font-bold" :
                  isPast ? "text-gray-400" :
                  "text-gray-700"
                }`} style={isTarget ? { color: accentColor } : undefined}>
                  {stop.stopName}
                  {isNotify && <Bell className="w-3 h-3 inline ml-1 text-amber-500" />}
                </div>
              </div>

              {/* Time */}
              <div className={`text-xs flex-shrink-0 ${isPast ? "text-gray-300" : "text-gray-400"}`}>
                {stop.departureTime.slice(0, 5)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── main tracker component ────────────────────────────────── */

interface DepartureTrackerProps {
  departure: Departure;
  currentTime: number;
  stationName: string;
  walkMinutes: number;
  onClose: () => void;
}

export function DepartureTracker({ departure, currentTime, stationName, walkMinutes, onClose }: DepartureTrackerProps) {
  const [stops, setStops] = useState<TripStop[]>([]);
  const [notifyStopId, setNotifyStopId] = useState<string | null>(null);
  const [notifyStopName, setNotifyStopName] = useState<string>("");
  const [notified, setNotified] = useState(false);
  // Minute-based notification
  const [notifyMinutes, setNotifyMinutes] = useState<number | null>(null);
  const [minuteNotified, setMinuteNotified] = useState(false);

  const timeToArrival = departure.arrival_timestamp - currentTime;
  const minutes = Math.floor(timeToArrival / 60);
  const seconds = timeToArrival % 60;
  const accentColor = getRouteAccent(departure.route_type);
  const vehicleType = getVehicleType(departure.route_type);
  const delay = departure.delay || 0;
  const delayMin = Math.floor(delay / 60);

  // Load trip stops + active notifications from DB
  useEffect(() => {
    if (departure.trip_id) {
      getTripStops(departure.trip_id).then(setStops);

      getActiveNotifications(departure.trip_id).then((active) => {
        for (const n of active) {
          if (n.notifyType === "stop" && n.notifyStopName) {
            setNotifyStopId("db-" + n.id);
            setNotifyStopName(n.notifyStopName);
          }
          if (n.notifyType === "minutes" && n.notifyMinutes) {
            setNotifyMinutes(n.notifyMinutes);
          }
        }
      });
    }
  }, [departure.trip_id]);

  // Find current stop in the stop list
  const currentStopId = departure.current_stop
    ? stops.find(s => s.stopName === departure.current_stop)?.stopId || null
    : null;

  // Find our target stop
  const targetStop = stops.find(s => s.stopName.includes(stationName));
  const targetStopId = targetStop?.stopId || "";

  // Progress calculation from stop positions
  const currentIdx = currentStopId ? stops.findIndex(s => s.stopId === currentStopId) : -1;
  const targetIdx = targetStopId ? stops.findIndex(s => s.stopId === targetStopId) : stops.length - 1;
  const progress = currentIdx >= 0 && targetIdx > 0
    ? Math.min(1, Math.max(0, currentIdx / targetIdx))
    : Math.min(1, Math.max(0, 1 - timeToArrival / (30 * 60)));

  const handleStopTap = useCallback(async (stop: TripStop) => {
    if (notifyStopId === stop.stopId) {
      setNotifyStopId(null);
      setNotifyStopName("");
      setNotified(false);
      return;
    }

    setNotifyStopId(stop.stopId);
    setNotifyStopName(stop.stopName);
    setNotified(false);

    // Request OneSignal push permission
    await requestPushPermission();

    // Save to Supabase
    await saveNotification({
      tripId: departure.trip_id || "",
      routeShortName: departure.route_short_name,
      headsign: departure.headsign,
      stationName,
      arrivalTimestamp: departure.arrival_timestamp,
      type: "stop",
      stopName: stop.stopName,
    });

    // Confirmation notification
    await sendLocalNotification(
      `🔔 ${departure.route_short_name} → ${departure.headsign}`,
      `Upozorníme tě až ${vehicleType.toLowerCase()} projede zastávkou ${stop.stopName}.\nPříjezd na ${stationName} za ${minutes} min ${seconds}s.`,
    );

    onClose();
  }, [notifyStopId, vehicleType, departure, stationName, minutes, seconds, onClose]);

  const handleMinuteNotify = useCallback(async (mins: number) => {
    if (notifyMinutes === mins) {
      setNotifyMinutes(null);
      setMinuteNotified(false);
      return;
    }

    setNotifyMinutes(mins);
    setMinuteNotified(false);

    await requestPushPermission();

    await saveNotification({
      tripId: departure.trip_id || "",
      routeShortName: departure.route_short_name,
      headsign: departure.headsign,
      stationName,
      arrivalTimestamp: departure.arrival_timestamp,
      type: "minutes",
      minutes: mins,
    });

    await sendLocalNotification(
      `⏰ ${departure.route_short_name} → ${departure.headsign}`,
      `Upozorníme tě ${mins} min před příjezdem na ${stationName}.\nAktuálně za ${minutes} min ${seconds}s.`,
    );

    onClose();
  }, [notifyMinutes, vehicleType, departure, stationName, minutes, seconds, onClose]);

  // Fire minute notification (local, when app is open)
  useEffect(() => {
    if (notifyMinutes === null || minuteNotified) return;
    if (minutes <= notifyMinutes && minutes > 0) {
      sendLocalNotification(
        `🚨 ${departure.route_short_name} → ${departure.headsign} za ${minutes} min!`,
        `Vyraz na ${stationName}!`,
      );
      setMinuteNotified(true);
    }
  }, [notifyMinutes, minuteNotified, minutes, vehicleType, departure.route_short_name, departure.headsign]);

  // Auto close when departed
  useEffect(() => {
    if (timeToArrival <= 0) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [timeToArrival, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          <div className="px-5 pb-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg"
                  style={{ backgroundColor: accentColor, fontSize: departure.route_short_name.length > 2 ? "1.1rem" : "1.5rem" }}
                >
                  {departure.route_short_name}
                </div>
                <div>
                  <div className="font-black text-gray-900 text-lg leading-tight">{departure.headsign}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {vehicleType} {departure.vehicle_number ? `#${departure.vehicle_number}` : ""}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 -mr-2 -mt-1 text-gray-400 active:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Countdown */}
            <div className="mt-3 bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  {timeToArrival > 0 ? (
                    <>
                      <div className="text-4xl font-black leading-none" style={{ color: accentColor }}>
                        {minutes}:{seconds.toString().padStart(2, "0")}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 font-medium">
                        {minutes <= walkMinutes ? "Nestíháš — už vyráž!" :
                         minutes <= walkMinutes + 2 ? "Běž — ještě to stihneš!" :
                         "do příjezdu"}
                      </div>
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-green-600">Odjelo</div>
                  )}
                </div>
                {delayMin > 0 && (
                  <span className="text-sm font-semibold px-3 py-1 rounded-full bg-red-100 text-red-600">
                    +{delayMin} min
                  </span>
                )}
              </div>

              {/* Mini progress bar */}
              <div className="relative h-2 mt-3 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-1000"
                  style={{ width: `${progress * 100}%`, backgroundColor: accentColor }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{departure.current_stop || "Na trase"}</span>
                <span>{stationName}</span>
              </div>
            </div>

            {/* Vehicle info */}
            {departure.current_stop && (
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                Právě u <strong>{departure.current_stop}</strong>
              </div>
            )}
            {departure.current_speed !== undefined && departure.current_speed > 0 && (
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                <Wind className="w-4 h-4 text-gray-400" />
                {Math.round(departure.current_speed)} km/h
              </div>
            )}

            <VehicleFeatures departure={departure} />

            {/* Notification status */}
            {notifyStopId && (
              <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <BellRing className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-sm text-amber-800">
                  {notified ? (
                    <><strong>Odesláno!</strong> Spoj projel {notifyStopName}</>
                  ) : (
                    <>Upozornění na zastávku <strong>{notifyStopName}</strong></>
                  )}
                </span>
                <button onClick={() => { setNotifyStopId(null); setNotified(false); }} className="ml-auto text-amber-400 active:text-amber-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Route diagram */}
            <RouteDiagram
              stops={stops}
              currentStopId={currentStopId}
              targetStopId={targetStopId}
              accentColor={accentColor}
              notifyStopId={notifyStopId}
              onStopTap={handleStopTap}
            />

            {/* Minute-based notification */}
            <div className="mt-4">
              <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Upozornit minuty před příjezdem
              </div>
              <div className="flex items-center gap-2">
                {[2, 3, 5, 8, 10].map((m) => (
                  <button
                    key={m}
                    onClick={() => handleMinuteNotify(m)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                      notifyMinutes === m ? "text-white shadow" : "bg-gray-100 text-gray-500 active:bg-gray-200"
                    }`}
                    style={notifyMinutes === m ? { backgroundColor: accentColor } : undefined}
                  >
                    {m} min
                  </button>
                ))}
              </div>
              {notifyMinutes !== null && (
                <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                  <BellRing className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                  <span className="text-sm text-blue-800">
                    {minuteNotified ? (
                      <><strong>Odesláno!</strong> Spoj je za {minutes} min</>
                    ) : (
                      <>Upozorním tě <strong>{notifyMinutes} min</strong> před příjezdem</>
                    )}
                  </span>
                  <button onClick={() => { setNotifyMinutes(null); setMinuteNotified(false); }} className="ml-auto text-blue-300 active:text-blue-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
