import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bell, BellOff, BellRing, MapPin, Clock, Wind, Accessibility,
  Snowflake, Wifi, Usb, BatteryCharging, Bike,
} from "lucide-react";
import { getTripStops, findNextTripId, type TripStop } from "@/utils/pidApi";
import { saveNotification, getActiveNotifications, requestPushPermission, cancelNotificationById } from "@/utils/notificationService";
import type { Departure } from "@/types/pid";

/* ── local notification (confirmation) ─────────────────────── */

async function sendLocalNotification(title: string, body: string) {
  try {
    const iconUrl = `${window.location.origin}/pictures/robotz-192.png`;
    const options = {
      body,
      icon: iconUrl,
      badge: iconUrl,
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
  delaySeconds,
  liveLastStopSeq,
  fractionalProgress,
}: {
  stops: TripStop[];
  currentStopId: string | null;
  targetStopId: string;
  accentColor: string;
  notifyStopId: string | null;
  onStopTap: (stop: TripStop) => void;
  delaySeconds: number;
  liveLastStopSeq: number | null;
  fractionalProgress: number;
}) {
  if (stops.length === 0) return null;

  const currentIdx = liveLastStopSeq !== null
    ? stops.findIndex(s => s.stopSequence === liveLastStopSeq)
    : currentStopId ? stops.findIndex(s => s.stopId === currentStopId) : -1;
  const targetIdx = stops.findIndex(s => s.stopId === targetStopId);

  // Add delay to scheduled times
  function getAdjustedTime(scheduledTime: string): string {
    if (delaySeconds === 0) return scheduledTime.slice(0, 5);
    const [h, m] = scheduledTime.split(":").map(Number);
    const totalMin = h * 60 + m + Math.round(delaySeconds / 60);
    const newH = Math.floor(totalMin / 60) % 24;
    const newM = totalMin % 60;
    return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
  }

  return (
    <div className="mt-4">
      <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5" />
        Trasa — klikni na zastávku pro upozornění
      </div>
      <div className="relative rounded-2xl bg-gray-50 p-3">
        {stops.map((stop, idx) => {
          const isPast = currentIdx >= 0 && idx <= currentIdx;
          const isCurrent = currentIdx >= 0 && idx === currentIdx;
          const isTarget = stop.stopId === targetStopId;
          const isNotify = stop.stopId === notifyStopId;

          // Fractional fill for current segment (between currentIdx and currentIdx+1)
          // Each segment = "line below row N" (upper half) + "line above row N+1" (lower half)
          const lineAboveFill =
            idx <= currentIdx ? 100 :
            idx === currentIdx + 1 ? Math.max(0, (fractionalProgress - 0.5) * 200) :
            0;
          const lineBelowFill =
            idx < currentIdx ? 100 :
            idx === currentIdx ? Math.min(100, fractionalProgress * 200) :
            0;

          return (
            <div
              key={`${stop.stopId}-${idx}`}
              className="flex items-stretch gap-3 cursor-pointer active:bg-gray-100 rounded-lg -mx-1 px-1"
              onClick={() => onStopTap(stop)}
            >
              {/* Timeline — flex column that stretches to row height so connectors never gap */}
              <div className="flex flex-col items-center flex-shrink-0 w-5 self-stretch">
                {/* Line above (fills upper half) */}
                <div className="w-0.5 flex-1 relative overflow-hidden" style={{ backgroundColor: idx > 0 ? "#d1d5db" : "transparent" }}>
                  {idx > 0 && (
                    <div
                      className="absolute top-0 left-0 right-0 transition-all duration-1000 ease-linear"
                      style={{ backgroundColor: accentColor, height: `${lineAboveFill}%` }}
                    />
                  )}
                </div>
                {/* Dot */}
                <div
                  className={`rounded-full flex-shrink-0 flex items-center justify-center my-0.5 ${
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
                {/* Line below (fills lower half) */}
                <div className="w-0.5 flex-1 relative overflow-hidden" style={{ backgroundColor: idx < stops.length - 1 ? "#d1d5db" : "transparent" }}>
                  {idx < stops.length - 1 && (
                    <div
                      className="absolute top-0 left-0 right-0 transition-all duration-1000 ease-linear"
                      style={{ backgroundColor: accentColor, height: `${lineBelowFill}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Stop info */}
              <div className="flex-1 min-w-0 self-center py-1.5">
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
              <div className={`text-xs flex-shrink-0 self-center ${isPast ? "text-gray-300" : "text-gray-400"}`}>
                {getAdjustedTime(stop.departureTime)}
                {delaySeconds > 30 && !isPast && (
                  <span className="text-red-400 ml-1">+{Math.round(delaySeconds / 60)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── continuation diagram (next route after vehicle continues) ─ */

function ContinuationDiagram({
  stops,
  routeShortName,
  direction,
  transferStopName,
  accentColor,
  delaySeconds,
}: {
  stops: TripStop[];
  routeShortName: string;
  direction?: string;
  transferStopName?: string;
  accentColor: string;
  delaySeconds: number;
}) {
  if (stops.length === 0) return null;

  // Skip the transfer stop itself (it's the same stop where current trip ended).
  const skipIdx = transferStopName
    ? stops.findIndex(s => s.stopName === transferStopName)
    : -1;
  const visibleStops = skipIdx >= 0 ? stops.slice(skipIdx) : stops;

  function getAdjustedTime(t: string): string {
    if (delaySeconds === 0) return t.slice(0, 5);
    const [h, m] = t.split(":").map(Number);
    const total = h * 60 + m + Math.round(delaySeconds / 60);
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
  }

  const headsign = visibleStops[visibleStops.length - 1]?.stopName || "";

  return (
    <div className="mt-3">
      {/* Divider */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-px bg-amber-300" />
        <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
          Pokračuje dále bez přestupu
        </div>
        <div className="flex-1 h-px bg-amber-300" />
      </div>

      {/* Route header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="rounded-lg px-2.5 py-1 font-bold text-white text-base"
          style={{ backgroundColor: accentColor }}
        >
          {routeShortName}
        </div>
        <i className="fa-solid fa-arrow-right text-gray-400" />
        <div className="font-bold text-gray-900">{direction || headsign}</div>
      </div>

      {/* Stops */}
      <div className="rounded-2xl bg-amber-50/60 border border-amber-200 p-3">
        {visibleStops.map((stop, idx) => (
          <div key={`cont-${stop.stopId}-${idx}`} className="flex items-stretch gap-3 py-0.5">
            <div className="flex flex-col items-center flex-shrink-0 w-5 self-stretch">
              <div className="w-0.5 flex-1" style={{ backgroundColor: idx > 0 ? "#d1d5db" : "transparent" }} />
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 my-0.5"
                style={{ backgroundColor: accentColor }}
              />
              <div className="w-0.5 flex-1" style={{ backgroundColor: idx < visibleStops.length - 1 ? "#d1d5db" : "transparent" }} />
            </div>
            <div className="flex-1 text-sm text-gray-700 leading-tight self-center">
              {stop.stopName}
            </div>
            <div className="text-xs text-gray-400 flex-shrink-0 self-center">
              {getAdjustedTime(stop.departureTime)}
            </div>
          </div>
        ))}
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
  const [continuationStops, setContinuationStops] = useState<TripStop[]>([]);
  const [notifyStopId, setNotifyStopId] = useState<string | null>(null);
  const [notifyStopName, setNotifyStopName] = useState<string>("");
  const [notifySubId, setNotifySubId] = useState<string | null>(null);
  const [notified, setNotified] = useState(false);
  const [notifyMinutes, setNotifyMinutes] = useState<number | null>(null);
  const [notifyMinutesSubId, setNotifyMinutesSubId] = useState<string | null>(null);
  const [minuteNotified, setMinuteNotified] = useState(false);

  // Live vehicle data
  const [liveCurrentStop, setLiveCurrentStop] = useState(departure.current_stop || "");
  const [liveDelay, setLiveDelay] = useState(departure.delay || 0);
  const [liveLastStopSeq, setLiveLastStopSeq] = useState<number | null>(null);

  // Track when we noticed the vehicle reach its current stop, so we can
  // smoothly interpolate position between this stop and the next one.
  const lastSeqRef = useRef<number | null>(null);
  const [lastStopArrivedAt, setLastStopArrivedAt] = useState(Date.now());
  useEffect(() => {
    if (liveLastStopSeq !== null && liveLastStopSeq !== lastSeqRef.current) {
      setLastStopArrivedAt(Date.now());
      lastSeqRef.current = liveLastStopSeq;
    }
  }, [liveLastStopSeq]);

  const delaySeconds = liveDelay;
  const timeToArrival = departure.arrival_timestamp - currentTime + delaySeconds;
  const minutes = Math.max(0, Math.floor(timeToArrival / 60));
  const seconds = Math.max(0, timeToArrival % 60);
  const accentColor = getRouteAccent(departure.route_type);
  const vehicleType = getVehicleType(departure.route_type);
  const delayMin = Math.floor(delaySeconds / 60);

  // Load trip stops + active notifications from DB
  useEffect(() => {
    if (departure.trip_id) {
      getTripStops(departure.trip_id).then(setStops);

      getActiveNotifications(departure.trip_id).then((active) => {
        for (const n of active) {
          if (n.notifyType === "stop" && n.notifyStopName) {
            // Use real stop_id when available so the user can tap-to-toggle off.
            setNotifyStopId(n.notifyStopId || "db-" + n.id);
            setNotifyStopName(n.notifyStopName);
            setNotifySubId(n.id);
          }
          if (n.notifyType === "minutes" && n.notifyMinutes) {
            setNotifyMinutes(n.notifyMinutes);
            setNotifyMinutesSubId(n.id);
          }
        }
      });
    }
  }, [departure.trip_id]);

  // Load continuation trip stops (e.g. line 6 → 34 at Nádraží Holešovice).
  // Needs the loaded `stops` to know the terminus stop_id + scheduled arrival.
  useEffect(() => {
    setContinuationStops([]);
    if (!departure.continues_as || stops.length === 0) return;

    const terminus = stops[stops.length - 1];
    if (!terminus) return;

    // Convert HH:MM:SS departureTime to today's unix timestamp.
    const [h, m, s] = (terminus.departureTime || "00:00:00").split(":").map(Number);
    const today = new Date();
    today.setHours(h || 0, m || 0, s || 0, 0);
    const arrivalUnix = Math.floor(today.getTime() / 1000);

    let cancelled = false;
    findNextTripId(terminus.stopId, departure.continues_as, arrivalUnix)
      .then((nextTripId) => {
        if (cancelled || !nextTripId) return;
        return getTripStops(nextTripId).then((nextStops) => {
          if (!cancelled) setContinuationStops(nextStops);
        });
      });
    return () => { cancelled = true; };
  }, [departure.continues_as, departure.trip_id, stops]);

  // Live poll vehicle position every 5s
  useEffect(() => {
    if (!departure.trip_id) return;
    const routeNum = departure.trip_id.split("_")[0];

    const poll = async () => {
      try {
        const res = await fetch(
          `https://api.golemio.cz/v2/vehiclepositions?routeShortName=${routeNum}&limit=30`,
          { headers: { "X-Access-Token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcwNCwiaWF0IjoxNzYwNzkxMjUwLCJleHAiOjExNzYwNzkxMjUwLCJpc3MiOiJnb2xlbWlvIiwianRpIjoiM2Y4MWJiMjItM2YxNC00ODgxLThlMDYtYjQ1YmRlOTYzZjk3In0.BR0653y2bfG0zxdkOYvDgvywRR9Z9nXB4NlatJXR38A" } }
        );
        if (!res.ok) return;
        const data = await res.json();
        for (const f of (data.features || [])) {
          if (f.properties?.trip?.gtfs?.trip_id === departure.trip_id) {
            const lp = f.properties.last_position;
            setLiveLastStopSeq(lp?.last_stop?.sequence || null);
            setLiveDelay(lp?.delay?.actual || 0);

            // Find stop name from our stops list
            if (lp?.last_stop?.id && stops.length > 0) {
              const found = stops.find(s => s.stopId === lp.last_stop.id);
              if (found) setLiveCurrentStop(found.stopName);
            }
            break;
          }
        }
      } catch {}
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [departure.trip_id, stops]);

  // Find current stop in the stop list
  const currentStopId = liveCurrentStop
    ? stops.find(s => s.stopName === liveCurrentStop)?.stopId || null
    : null;

  // Find our target stop
  const targetStop = stops.find(s => s.stopName.includes(stationName));
  const targetStopId = targetStop?.stopId || "";

  // Progress calculation from stop positions
  const currentIdx = liveLastStopSeq !== null
    ? stops.findIndex(s => s.stopSequence === liveLastStopSeq)
    : currentStopId ? stops.findIndex(s => s.stopId === currentStopId) : -1;
  const targetIdx = targetStopId ? stops.findIndex(s => s.stopId === targetStopId) : stops.length - 1;

  // Fractional progress between currentIdx and currentIdx+1 based on scheduled segment time.
  // Drives smooth movement between API polls (which only refresh every 5s).
  const fractionalProgress = (() => {
    if (currentIdx < 0 || currentIdx >= stops.length - 1) return 0;
    const cur = stops[currentIdx];
    const nxt = stops[currentIdx + 1];
    if (!cur || !nxt) return 0;
    const [ch, cm] = cur.departureTime.split(":").map(Number);
    const [nh, nm] = nxt.departureTime.split(":").map(Number);
    let segMin = (nh * 60 + nm) - (ch * 60 + cm);
    if (segMin <= 0) segMin += 24 * 60;
    if (segMin <= 0) return 0;
    const elapsedSec = (Date.now() - lastStopArrivedAt) / 1000;
    return Math.min(1, Math.max(0, elapsedSec / (segMin * 60)));
  })();

  const progress = currentIdx >= 0 && targetIdx > 0
    ? Math.min(1, Math.max(0, (currentIdx + fractionalProgress) / targetIdx))
    : Math.min(1, Math.max(0, 1 - timeToArrival / (30 * 60)));

  const handleStopTap = useCallback(async (stop: TripStop) => {
    // Toggle off → cancel the existing DB row.
    if (notifyStopId === stop.stopId) {
      setNotifyStopId(null);
      setNotifyStopName("");
      setNotified(false);
      if (notifySubId) {
        await cancelNotificationById(notifySubId);
        setNotifySubId(null);
      }
      return;
    }

    setNotifyStopId(stop.stopId);
    setNotifyStopName(stop.stopName);
    setNotified(false);

    // Ensure FCM token / push permission BEFORE save — otherwise sub gets stored
    // with a "local-..." endpoint and the server skips it forever.
    const token = await requestPushPermission();
    if (!token) {
      await sendLocalNotification(
        `Oznámení nejsou povolená`,
        `Klikni v hlavičce na "Zapnout oznámení o příjezdech" a zkus to znovu.`,
      );
      setNotifyStopId(null);
      setNotifyStopName("");
      return;
    }

    const result = await saveNotification({
      tripId: departure.trip_id || "",
      routeShortName: departure.route_short_name,
      headsign: departure.headsign,
      stationName,
      arrivalTimestamp: departure.arrival_timestamp,
      type: "stop",
      stopName: stop.stopName,
      stopId: stop.stopId,
      stopSequence: stop.stopSequence,
    });

    if (!result.ok) {
      await sendLocalNotification(
        `Chyba`,
        result.reason === "no_token"
          ? `Nejprve zapni oznámení (modré tlačítko nahoře).`
          : `Nepovedlo se uložit upozornění. Zkus to znovu.`,
      );
      setNotifyStopId(null);
      setNotifyStopName("");
      return;
    }

    // Confirmation notification
    await sendLocalNotification(
      `Sledování zapnuto`,
      `${vehicleType} ${departure.route_short_name} → ${departure.headsign}\nUpozorníme tě na zastávce ${stop.stopName}\nPříjezd: ${stationName} za ${minutes} min`,
    );

    onClose();
  }, [notifyStopId, notifySubId, vehicleType, departure, stationName, minutes, seconds, onClose]);

  const handleMinuteNotify = useCallback(async (mins: number) => {
    if (notifyMinutes === mins) {
      setNotifyMinutes(null);
      setMinuteNotified(false);
      if (notifyMinutesSubId) {
        await cancelNotificationById(notifyMinutesSubId);
        setNotifyMinutesSubId(null);
      }
      return;
    }

    setNotifyMinutes(mins);
    setMinuteNotified(false);

    const token = await requestPushPermission();
    if (!token) {
      await sendLocalNotification(
        `Oznámení nejsou povolená`,
        `Klikni v hlavičce na "Zapnout oznámení o příjezdech" a zkus to znovu.`,
      );
      setNotifyMinutes(null);
      return;
    }

    const result = await saveNotification({
      tripId: departure.trip_id || "",
      routeShortName: departure.route_short_name,
      headsign: departure.headsign,
      stationName,
      arrivalTimestamp: departure.arrival_timestamp,
      type: "minutes",
      minutes: mins,
    });

    if (!result.ok) {
      setNotifyMinutes(null);
      return;
    }

    await sendLocalNotification(
      `Sledování zapnuto`,
      `${vehicleType} ${departure.route_short_name} → ${departure.headsign}\nUpozornění ${mins} min před příjezdem\nPříjezd: ${stationName} za ${minutes} min`,
    );

    onClose();
  }, [notifyMinutes, notifyMinutesSubId, vehicleType, departure, stationName, minutes, seconds, onClose]);

  // Fire minute notification (local, when app is open)
  useEffect(() => {
    if (notifyMinutes === null || minuteNotified) return;
    if (minutes <= notifyMinutes && minutes > 0) {
      sendLocalNotification(
        `${vehicleType} ${departure.route_short_name} za ${minutes} min!`,
        `${departure.headsign} → ${stationName}\nVyraz ze školy!`,
      );
      setMinuteNotified(true);
    }
  }, [notifyMinutes, minuteNotified, minutes, vehicleType, departure.route_short_name, departure.headsign]);

  // Fire stop-arrival notification (local, when app is open) — mirrors server-side trigger.
  // Fires once when the vehicle reaches or passes the chosen stop.
  useEffect(() => {
    if (!notifyStopId || notified) return;
    const notifyIdx = stops.findIndex(s => s.stopId === notifyStopId);
    if (notifyIdx < 0) return;
    if (currentIdx >= 0 && currentIdx >= notifyIdx) {
      sendLocalNotification(
        `${vehicleType} ${departure.route_short_name} projíždí ${notifyStopName}!`,
        `${departure.headsign} → ${stationName}\nBlíží se!`,
      );
      setNotified(true);
    }
  }, [notifyStopId, notifyStopName, notified, currentIdx, stops, vehicleType, departure.route_short_name, departure.headsign, stationName]);

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
                <span>{liveCurrentStop || "Na trase"}</span>
                <span>{stationName}</span>
              </div>
            </div>

            {/* Vehicle info */}
            {liveCurrentStop && (
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                Právě u <strong>{liveCurrentStop}</strong>
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
              delaySeconds={delaySeconds}
              liveLastStopSeq={liveLastStopSeq}
              fractionalProgress={fractionalProgress}
            />

            {/* Pokračování bez přestupu — vykreslí seznam zastávek navazující linky */}
            {departure.continues_as && continuationStops.length > 0 && (
              <ContinuationDiagram
                stops={continuationStops}
                routeShortName={departure.continues_as}
                direction={departure.continues_direction}
                transferStopName={departure.continues_from}
                accentColor={accentColor}
                delaySeconds={delaySeconds}
              />
            )}

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
