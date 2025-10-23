import { useState, useEffect } from "react";
import { Clock, AlertTriangle, Info, Snowflake, Car, MapPin, Wrench, Bus, Wind, Wifi, Accessibility, Bike, Zap, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDepartures, setThirdApiKey } from "@/utils/pidApi";
import type { Departure } from "@/types/pid";

interface PreloadedTramDeparturesProps {
  stationId: string | string[];
  maxItems?: number;
  customTitle?: string;
  showTimesInMinutes?: boolean;
  preloadedData?: {[key: string]: any};
}

export const PreloadedTramDepartures = ({
  stationId,
  maxItems = 8,
  customTitle,
  showTimesInMinutes = false,
  preloadedData = {}
}: PreloadedTramDeparturesProps) => {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Helper pro získání klíče
  const getStationKey = () => {
    const ids = Array.isArray(stationId) ? stationId : [stationId];
    return ids.join(',');
  };

  const fetchDepartures = async (isRetry = false) => {
    try {
      setError(null);
      const key = getStationKey();

      // Zkus použít preloadovaná data
      if (preloadedData[key] && !isRetry) {
        const preloaded = preloadedData[key];
        const age = Date.now() - preloaded.timestamp;

        // Pokud jsou data mladší než 30 sekund, použij je
        if (age < 30000) {
          setDepartures(preloaded.data || []);
          setLastUpdate(new Date(preloaded.timestamp));
          setLoading(false);
          return;
        }
      }

      // Jinak načti čerstvá data
      const result = await getDepartures(stationId);
      const { departures: departuresData } = result;

      setDepartures(departuresData);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error: any) {
      setError(error.message || 'Chyba při načítání odjezdů');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartures();

    // Refresh každých 60 sekund
    const interval = setInterval(() => fetchDepartures(), 60000);

    return () => clearInterval(interval);
  }, [stationId, preloadedData]);

  const getRouteNumber = (departure: Departure): string => {
    if (!departure.route_short_name) return '?';

    const routeName = departure.route_short_name.toString();

    if (routeName.includes('_')) {
      const parts = routeName.split('_');
      return parts[0] || '?';
    }

    return routeName;
  };

  const formatTime = (timestamp: number, showInMinutes: boolean = false) => {
    if (showInMinutes) {
      const now = Date.now() / 1000;
      const diffMinutes = Math.round((timestamp - now) / 60);

      if (diffMinutes <= 0) return "0 min";
      return `${diffMinutes} min`;
    }

    return new Date(timestamp * 1000).toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDelay = (delay: number | undefined) => {
    if (!delay || delay === 0) return null;
    const sign = delay > 0 ? '+' : '';
    return `${sign}${delay} min`;
  };

  const getRouteTypeColor = (routeType: number) => {
    switch (routeType) {
      case 0: return 'bg-blue-600';
      case 1: return 'bg-green-600';
      case 3: return 'bg-red-600';
      case 11: return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const getRouteTypeIcon = (routeType: number) => {
    switch (routeType) {
      case 0: return '🚊';
      case 1: return '🚇';
      case 3: return '🚌';
      case 11: return '🚎';
      default: return '🚐';
    }
  };

  if (loading) {
    return (
      <Card className="w-full h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2" style={{ fontSize: `${Math.max(1.4, 2.2 * 1.0)}rem` }}>
            <Clock className="w-6 h-6" />
            {customTitle || "Načítám odjezdy..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-gray-700 mb-2 text-xl" style={{ fontSize: `${1.5 * 1.0}rem` }}>Načítám odjezdy...</p>
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-red-600" style={{ fontSize: `${Math.max(1.4, 2.2 * 1.0)}rem` }}>
            <AlertTriangle className="w-6 h-6" />
            Chyba načítání
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-2 text-lg" style={{ fontSize: `${1.25 * 1.0}rem` }}>{error}</p>
          <button
            onClick={() => fetchDepartures(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            style={{ fontSize: `${1 * 1.0}rem` }}
          >
            Zkusit znovu
          </button>
        </CardContent>
      </Card>
    );
  }

  const displayDepartures = departures.slice(0, maxItems);

  if (displayDepartures.length === 0) {
    return (
      <Card className="w-full h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2" style={{ fontSize: `${Math.max(1.4, 2.2 * 1.0)}rem` }}>
            <Info className="w-6 h-6" />
            {customTitle || "Žádné odjezdy"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p style={{ fontSize: `${Math.max(1.8, 2.8 * 1.0)}rem` }}>Žádné odjezdy do 30 min</p>
          <p style={{ fontSize: `${Math.max(1.4, 2.2 * 1.0)}rem` }}>Zkontrolujte později</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2" style={{ fontSize: `${Math.max(1.4, 2.2 * 1.0)}rem` }}>
          <Clock className="w-6 h-6" />
          {customTitle || `Odjezdy (${displayDepartures.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1" style={{ fontSize: `${textSize}rem` }}>
        {displayDepartures.map((departure, index) => {
          const routeNumber = getRouteNumber(departure);
          const routeColor = getRouteTypeColor(departure.route_type);
          const routeIcon = getRouteTypeIcon(departure.route_type);
          const delayText = formatDelay(departure.delay);

          return (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg text-white font-bold flex items-center justify-center ${routeColor}`}
                  style={{
                    width: departure.route_short_name.length > 2 ?
                      `${Math.max(2.8, 4.2 * 1.0)}rem` :
                      `${Math.max(2.4, 3.6 * 1.0)}rem`,
                    height: `${Math.max(2.4, 3.6 * 1.0)}rem`,
                    fontSize: departure.route_short_name.length > 2 ?
                      `${Math.max(1.0, 1.8 * 1.0)}rem` :
                      `${Math.max(1.2, 2.4 * 1.0)}rem`
                  }}
                >
                  {routeNumber}
                </div>

                <div className="flex-1">
                  <span className="font-bold text-gray-900" style={{ fontSize: `${Math.max(1.6, 2.8 * 1.0)}rem` }}>
                    {departure.headsign}
                  </span>

                  <div className="flex items-center gap-2 mt-1">
                    {departure.wheelchair_accessible && (
                      <i className="fas fa-wheelchair text-blue-600" style={{ fontSize: `${Math.max(0.9, 1.4 * 1.0)}rem` }}></i>
                    )}
                    {departure.low_floor && (
                      <span className="text-green-600 font-bold text-sm bg-green-100 px-1 rounded" style={{ fontSize: `${Math.max(0.7, 1.2 * 1.0)}rem` }}>
                        NP
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-black text-gray-900" style={{ fontSize: `${Math.max(2.2, 4.0 * 1.0)}rem` }}>
                  {formatTime(departure.departure_timestamp, showTimesInMinutes)}
                </div>
                {delayText && (
                  <div
                    className={`text-sm font-medium ${departure.delay && departure.delay > 0 ? 'text-red-600' : 'text-green-600'}`}
                    style={{ fontSize: `${Math.max(0.5, 0.8 * 1.0)}rem` }}
                  >
                    {delayText}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="mt-4 pt-2 border-t border-gray-200 text-xs text-gray-500 text-center">
          Poslední aktualizace: {lastUpdate.toLocaleTimeString('cs-CZ')}
        </div>
      </CardContent>
    </Card>
  );
};