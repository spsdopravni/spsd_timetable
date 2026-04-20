import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";
import { DepartureTracker } from "@/components/DepartureTracker";
import { useDataContext } from "@/context/DataContext";
import type { Departure } from "@/types/pid";

/**
 * Stránka která dostane sdílený odkaz a otevře DepartureTracker
 * pro daný spoj. Funguje i když spoj už odjel — tracker pak ukáže "Odjelo".
 *
 * Format URL: /share?d=<base64-JSON encoded Departure subset>&station=<name>
 * (alternativně: /share?trip=...&route=...&headsign=...&type=...&arrival=...&station=...)
 */
const Share = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { time } = useDataContext();
  const [error, setError] = useState<string | null>(null);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [stationName, setStationName] = useState<string>("");
  const [nowSec, setNowSec] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setNowSec(Math.floor((Date.now() + (time?.timeOffset || 0)) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [time?.timeOffset]);

  useEffect(() => {
    try {
      const d = params.get("d");
      const station = params.get("station") || "";
      setStationName(station);

      let dep: Partial<Departure> = {};
      if (d) {
        // Base64 JSON encoded Departure — primary path. atob() vrací Latin-1
        // string, takže UTF-8 znaky (ě, š, í...) musíme dekódovat ručně.
        const bytes = Uint8Array.from(atob(d), (c) => c.charCodeAt(0));
        const json = new TextDecoder("utf-8").decode(bytes);
        dep = JSON.parse(json);
      } else {
        // Fallback: explicit query params
        dep = {
          trip_id: params.get("trip") || "",
          route_short_name: params.get("route") || "",
          headsign: params.get("headsign") || "",
          route_type: parseInt(params.get("type") || "0", 10),
          arrival_timestamp: parseInt(params.get("arrival") || "0", 10),
          departure_timestamp: parseInt(params.get("arrival") || "0", 10),
        };
      }

      if (!dep.trip_id || !dep.route_short_name) {
        setError("Odkaz na spoj je neúplný.");
        return;
      }

      // Doplň defaults aby tracker fungoval bez crashu.
      const full: Departure = {
        arrival_timestamp: dep.arrival_timestamp || 0,
        departure_timestamp: dep.departure_timestamp || dep.arrival_timestamp || 0,
        delay: dep.delay || 0,
        route_short_name: dep.route_short_name || "?",
        route_type: dep.route_type ?? 0,
        headsign: dep.headsign || "Sdílený spoj",
        trip_id: dep.trip_id,
        wheelchair_accessible: false,
        ...dep,
      } as Departure;

      setDeparture(full);
    } catch (e: any) {
      setError("Odkaz se nepodařilo zpracovat.");
    }
  }, [params]);

  if (error) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-amber-50 px-6">
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <div className="text-xl font-bold text-gray-900 mb-2">Sdílený spoj</div>
        <div className="text-gray-600 text-center mb-6">{error}</div>
        <button
          onClick={() => navigate("/m")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold active:bg-blue-700"
        >
          <Home className="w-4 h-4" /> Hlavní strana
        </button>
      </div>
    );
  }

  if (!departure) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-100 to-blue-100/50 flex items-center justify-center">
      <div className="text-center px-6">
        <div className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-2">Sdílený spoj</div>
        <div className="text-2xl font-black text-gray-900 mb-1">
          {departure.route_short_name} → {departure.headsign}
        </div>
        <div className="text-gray-600 mb-8">
          Cíl: <strong>{stationName || "—"}</strong>
        </div>
        <button
          onClick={() => navigate("/m")}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold active:bg-gray-50 shadow-sm"
        >
          <Home className="w-4 h-4" /> Hlavní strana
        </button>
      </div>

      <DepartureTracker
        departure={departure}
        currentTime={nowSec}
        stationName={stationName}
        walkMinutes={2} // default — bez kontextu nemáme reálný walk time
        onClose={() => navigate("/m")}
      />
    </div>
  );
};

export default Share;
