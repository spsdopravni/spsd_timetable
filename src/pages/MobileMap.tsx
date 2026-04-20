import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Locate } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useUserLocation } from "@/utils/useUserLocation";
import { useDarkMode } from "@/utils/useDarkMode";

interface Vehicle {
  id: string;
  routeShort: string;
  routeType: number;
  lat: number;
  lon: number;
  bearing: number;
  delayMin: number;
  headsign: string;
}

const GOLEMIO_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcwNCwiaWF0IjoxNzYwNzkxMjUwLCJleHAiOjExNzYwNzkxMjUwLCJpc3MiOiJnb2xlbWlvIiwianRpIjoiM2Y4MWJiMjItM2YxNC00ODgxLThlMDYtYjQ1YmRlOTYzZjk3In0.BR0653y2bfG0zxdkOYvDgvywRR9Z9nXB4NlatJXR38A";

// Centra škol — defaultní view když uživatel nemá GPS.
const DEFAULT_CENTER: [number, number] = [50.0735, 14.4407]; // Moravská
const DEFAULT_RADIUS_KM = 1.0;

function colorForRouteType(t: number): string {
  switch (t) {
    case 0: return "#dc2626"; // tram
    case 1: return "#16a34a"; // metro
    case 2: return "#7c3aed"; // train
    case 3: return "#2563eb"; // bus
    default: return "#6b7280";
  }
}

function vehicleIcon(routeShort: string, routeType: number, bearing: number, delayMin: number): L.DivIcon {
  const color = colorForRouteType(routeType);
  const delayText = delayMin > 1 ? `<div style="position:absolute;top:-8px;right:-8px;background:#ef4444;color:#fff;font-size:8px;font-weight:700;padding:1px 4px;border-radius:8px">+${delayMin}</div>` : "";
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;transform:translate(-50%,-50%);">
        <div style="
          background:${color};color:#fff;font-weight:700;font-size:11px;
          padding:3px 7px;border-radius:8px;border:2px solid #fff;
          box-shadow:0 2px 4px rgba(0,0,0,0.3);white-space:nowrap;
        ">${routeShort}</div>
        <div style="
          position:absolute;top:-4px;left:50%;transform:translate(-50%,-100%) rotate(${bearing || 0}deg);
          width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;
          border-bottom:7px solid ${color};
        "></div>
        ${delayText}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function userIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;transform:translate(-50%,-50%);">
        <div style="position:absolute;width:24px;height:24px;left:-12px;top:-12px;
          background:radial-gradient(circle,rgba(37,99,235,0.4) 0%,rgba(37,99,235,0) 70%);
          border-radius:50%;animation:upulse 2s ease-in-out infinite;"></div>
        <div style="width:14px;height:14px;background:#2563eb;border:2px solid #fff;
          border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>
      </div>
      <style>@keyframes upulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.5);opacity:.2}}</style>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function RecenterButton({ lat, lon }: { lat?: number; lon?: number }) {
  const map = useMap();
  if (lat === undefined || lon === undefined) return null;
  return (
    <button
      onClick={() => map.setView([lat, lon], 16)}
      className="absolute top-3 right-3 z-[400] bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg active:bg-gray-100 dark:active:bg-gray-700"
      aria-label="Centrovat na moji polohu"
    >
      <Locate className="w-4 h-4 text-gray-700 dark:text-gray-200" />
    </button>
  );
}

const MobileMap = () => {
  const userLoc = useUserLocation(true);
  const { isDark } = useDarkMode();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const center: [number, number] = userLoc.location
    ? [userLoc.location.lat, userLoc.location.lon]
    : DEFAULT_CENTER;

  const fetchVehicles = async () => {
    try {
      // Bounding box ±radius around user (or default center)
      const lat = center[0];
      const lon = center[1];
      const dLat = DEFAULT_RADIUS_KM / 111;
      const dLon = DEFAULT_RADIUS_KM / (111 * Math.cos(lat * Math.PI / 180));
      const url = `https://api.golemio.cz/v2/vehiclepositions?latlng=${lat}%2C${lon}&range=${DEFAULT_RADIUS_KM * 1000}&limit=80`;
      const res = await fetch(url, { headers: { "X-Access-Token": GOLEMIO_API_KEY } });
      if (!res.ok) {
        setError(`API ${res.status}`);
        return;
      }
      const data = await res.json();
      const vs: Vehicle[] = (data.features || [])
        .map((f: any) => {
          const coords = f.geometry?.coordinates;
          if (!coords || coords.length < 2) return null;
          return {
            id: f.properties?.trip?.gtfs?.trip_id || `${coords[0]}-${coords[1]}`,
            routeShort: f.properties?.trip?.gtfs?.route_short_name || "?",
            routeType: f.properties?.trip?.gtfs?.route_type ?? 0,
            lat: coords[1],
            lon: coords[0],
            bearing: f.properties?.last_position?.bearing || 0,
            delayMin: Math.round((f.properties?.last_position?.delay?.actual || 0) / 60),
            headsign: f.properties?.trip?.gtfs?.trip_headsign || "",
          } as Vehicle;
        })
        .filter((v: Vehicle | null): v is Vehicle => v !== null);
      setVehicles(vs);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchVehicles();
    intervalRef.current = setInterval(fetchVehicles, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoc.location?.lat, userLoc.location?.lon]);

  return (
    <div className="h-[100dvh] flex flex-col bg-white dark:bg-gray-900 relative">
      <div
        className="px-4 pt-3 pb-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-10 border-b border-gray-200 dark:border-gray-800 flex-shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <div className="flex items-baseline justify-between">
          <h1 className="text-lg font-black text-gray-900 dark:text-gray-100">Vozy v okolí</h1>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {error ? `Chyba: ${error}` : `${vehicles.length} vozů, refresh 5s`}
          </div>
        </div>
      </div>

      <div className="flex-1 relative" style={{ marginBottom: "calc(env(safe-area-inset-bottom, 0px) + 42px)" }}>
        <MapContainer
          center={center}
          zoom={15}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={isDark
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
          />
          {vehicles.map((v) => (
            <Marker
              key={v.id}
              position={[v.lat, v.lon]}
              icon={vehicleIcon(v.routeShort, v.routeType, v.bearing, v.delayMin)}
            />
          ))}
          {userLoc.location && (
            <Marker
              position={[userLoc.location.lat, userLoc.location.lon]}
              icon={userIcon()}
              interactive={false}
            />
          )}
          <RecenterButton lat={userLoc.location?.lat} lon={userLoc.location?.lon} />
        </MapContainer>
      </div>

      <BottomNav />
    </div>
  );
};

export default MobileMap;
