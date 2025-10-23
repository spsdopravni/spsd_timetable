import { useState, useEffect, memo } from "react";
import { Clock, AlertTriangle, Info, Snowflake, Car, MapPin, Wrench, Bus, Wind, Wifi, Accessibility, Bike, Zap, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDepartures, setThirdApiKey } from "@/utils/pidApi";
import type { Departure } from "@/types/pid";

interface TramDeparturesProps {
  stationId: string | string[];
  maxItems?: number;
  customTitle?: string;
  showTimesInMinutes?: boolean;
  lowPerformanceMode?: boolean;
  stationName?: string;
}

const TramDeparturesComponent = ({ stationId, maxItems = 5, customTitle, showTimesInMinutes = false, lowPerformanceMode = false, stationName = "" }: TramDeparturesProps) => {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [nextDepartures, setNextDepartures] = useState<Departure[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [retryDelay, setRetryDelay] = useState(60000);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [previousStationId, setPreviousStationId] = useState<string | string[]>("");
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchDepartures = async (isRetry = false) => {
    try {
      setError(null);
      setIsRateLimited(false);

      // Předčítání dat na pozadí
      const result = await getDepartures(stationId);
      const { departures: departuresData } = result;

      if (departuresData.length === 0 && retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchDepartures(true), 5000);
        return;
      }

      // Vždy bez animací pro úsporu RAM
      setDepartures(departuresData);
      setLastUpdate(new Date());
      setRetryDelay(lowPerformanceMode ? 180000 : 120000); // 3 min vs 2 min
      setRetryCount(0);
      setIsUpdating(false);
    } catch (error: any) {

      if (error.message === 'RATE_LIMIT' || error.message === 'RATE_LIMIT_PROTECTION') {
        setError("API limit dosažen - čekám déle...");
        setIsRateLimited(true);
        setRetryDelay(120000);
      } else if (error.message?.includes('429') || error.message?.includes('too many')) {
        setError("Příliš mnoho požadavků - čekám déle...");
        setIsRateLimited(true);
        setRetryDelay(prev => Math.min(prev * 2, 300000));
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        setError("Chyba autentifikace - zkontrolujte API klíče");
        setRetryDelay(300000); // 5 minut
      } else {
        setError("Chyba při načítání odjezdů");
        setRetryDelay(120000);
      }
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    // Přidáme globální funkci pro nastavení třetího API klíče (pokud není nastaven)
    (window as any).setThirdApiKey = setThirdApiKey;

    const stationChanged = JSON.stringify(previousStationId) !== JSON.stringify(stationId);

    if (stationChanged) {
      setRetryCount(0);
      setPreviousStationId(stationId);

      // Preload data first - načteme data na pozadí
      const preloadData = async () => {
        try {
          const result = await getDepartures(stationId);
          setNextDepartures(result.departures);

          // Při prvním načtení žádná animace
          if (isInitialLoad || departures.length === 0) {
            setDepartures(result.departures);
            setLastUpdate(new Date());
            setLoading(false);
            setIsInitialLoad(false);
            return;
          }

          // Fade out -> změna dat -> fade in animace
          // 1. Fade out (300ms)
          setIsUpdating(true);

          // 2. Po fade out změníme data
          setTimeout(() => {
            setDepartures(result.departures);
            setLastUpdate(new Date());

            // 3. Fade in + layout animace
            setTimeout(() => {
              setIsUpdating(false);
            }, 50);
          }, 300);
        } catch (error) {
          // If preload fails, fall back to normal fetch
          setIsUpdating(false);
          setLoading(false);
          fetchDepartures();
        }
      };

      preloadData();
    }
  }, [stationId]);

  useEffect(() => {
    if (JSON.stringify(previousStationId) === JSON.stringify(stationId)) {
      const interval = setInterval(() => {
        fetchDepartures();
      }, retryDelay);

      return () => clearInterval(interval);
    }
  }, [stationId, retryDelay, previousStationId]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const formatVehicleNumber = (vehicleNumber: string, routeNumber: string, tripNumber: string) => {
    // Formát: #9418 na 9/18 (vozidlo na lince/číslo spoje)
    if (vehicleNumber && routeNumber && tripNumber) {
      // Použijeme extrahované číslo spoje z GTFS trip_id
      return `#${vehicleNumber} na ${routeNumber}/${tripNumber}`;
    }
    return `#${vehicleNumber}`;
  };

  const getDelayBadge = (delay: number) => {
    if (delay <= 0) return { text: "Včas", color: "bg-green-100 text-green-800" };
    const minutes = Math.floor(delay / 60);
    if (minutes === 0) return { text: "Včas", color: "bg-green-100 text-green-800" };
    if (delay <= 60) return { text: `+${minutes} min`, color: "bg-yellow-100 text-yellow-800" };
    return { text: `+${minutes} min`, color: "bg-red-100 text-red-800" };
  };

  const getVehicleTypeInfo = (departure: Departure) => {
    const timeToArrival = departure.arrival_timestamp - Math.floor(Date.now() / 1000);
    
    if (timeToArrival <= 120 && timeToArrival > 0) {
      const vehicleType = getVehicleType(departure.route_type);
      return `${vehicleType} se blíži do stanice`;
    }
    
    return null;
  };

  const getVehicleType = (routeType: number) => {
    switch (routeType) {
      case 0: return "Tramvaj";
      case 1: return "Metro";
      case 2: return "Vlak";
      case 3: return "Autobus";
      default: return "Vozidlo";
    }
  };

  const getRouteColor = (routeType: number) => {
    switch (routeType) {
      case 0: return "bg-red-100 text-red-800";
      case 3: return "bg-blue-100 text-blue-800";
      case 1: return "bg-green-100 text-green-800";
      case 2: return "bg-purple-100 text-purple-800";
      default: return "bg-red-100 text-red-800";
    }
  };

  const hasAirConditioning = (departure: Departure) => {
    // Stejně jako low_floor - používá departure.air_conditioning
    return departure.air_conditioning || false;
  };

  const getDirectionDisplay = (departure: Departure) => {
    const routeNumber = departure.route_short_name;
    const headsign = departure.headsign;

    // Speciální logika pro linku 174 končící na "Luka"
    if (routeNumber === "174" && headsign && headsign.toLowerCase().includes("luka")) {
      return (
        <div className="flex items-center gap-2">
          <span>{headsign}</span>
          <img
            src="/pictures/metroB.svg"
            alt="Metro B"
            className="w-6 h-6 inline-block"
          />
          <ArrowRight className="w-4 h-4 text-blue-600" />
          <span className="text-blue-600 font-medium">301/352</span>
        </div>
      );
    }

    return headsign;
  };

  const getServiceAlerts = (departure: Departure) => {
    const alerts = [];

    const headsign = departure.headsign?.toLowerCase() || '';

    const isShortened = headsign.includes('jen do') || headsign.includes('pouze do');
    const isToDepot = headsign.includes('vozovna') && !headsign.includes('ústředn');

    // Klimatizace se zobrazuje jako ikona vedle názvu, takže ji nepotřebujeme v alerts
    // if (departure.air_conditioning) {
    //   alerts.push({
    //     icon: <Snowflake className="w-5 h-5 text-cyan-600" style={{ width: `${1.5 * 1.0}rem`, height: `${1.5 * 1.0}rem` }} />,
    //     text: "Klimatizace",
    //     color: "bg-cyan-100 text-cyan-800"
    //   });
    // }

    if (departure.wifi) {
      alerts.push({
        icon: <Wifi className="w-5 h-5 text-blue-600" style={{ width: `${1.5 * 1.0}rem`, height: `${1.5 * 1.0}rem` }} />,
        text: "WiFi",
        color: "bg-blue-100 text-blue-800"
      });
    }

    if (departure.low_floor) {
      alerts.push({
        icon: <Accessibility className="w-5 h-5 text-green-600" style={{ width: `${1.5 * 1.0}rem`, height: `${1.5 * 1.0}rem` }} />,
        text: "Nízká podlaha",
        color: "bg-green-100 text-green-800"
      });
    }

    if (departure.usb_charging) {
      alerts.push({
        icon: <Zap className="w-5 h-5 text-yellow-600" style={{ width: `${1.5 * 1.0}rem`, height: `${1.5 * 1.0}rem` }} />,
        text: "USB nabíjení",
        color: "bg-yellow-100 text-yellow-800"
      });
    }

    if (departure.bike_rack) {
      alerts.push({
        icon: <Bike className="w-5 h-5 text-orange-600" style={{ width: `${1.5 * 1.0}rem`, height: `${1.5 * 1.0}rem` }} />,
        text: "Stojan na kola",
        color: "bg-orange-100 text-orange-800"
      });
    }

    if (isShortened) {
      alerts.push({
        icon: <AlertTriangle className="w-5 h-5 text-yellow-600" style={{ width: `${1.5 * 1.0}rem`, height: `${1.5 * 1.0}rem` }} />,
        text: "Zkrácená jízda",
        color: "bg-yellow-100 text-yellow-800"
      });
    }

    if (isToDepot) {
      alerts.push({
        icon: <Wrench className="w-5 h-5 text-orange-600" style={{ width: `${1.5 * 1.0}rem`, height: `${1.5 * 1.0}rem` }} />,
        text: "Jízda do vozovny",
        color: "bg-orange-100 text-orange-800"
      });
    }

    if (departure.alert_hash) {
      if (departure.alert_hash === 'canceled') {
        alerts.push({
          icon: <AlertTriangle className="w-5 h-5 text-red-600" style={{ width: `${1.5 * 1.0}rem`, height: `${1.5 * 1.0}rem` }} />,
          text: "Zrušeno",
          color: "bg-red-100 text-red-800"
        });
      } else {
        alerts.push({
          icon: <Info className="w-5 h-5 text-blue-600" style={{ width: `${1.5 * 1.0}rem`, height: `${1.5 * 1.0}rem` }} />,
          text: "Výluka/Omezení",
          color: "bg-blue-100 text-blue-800"
        });
      }
    }

    return alerts;
  };

  const formatDisplayTime = (departure: Departure) => {
    const timeToArrival = departure.arrival_timestamp - Math.floor(Date.now() / 1000);

    if (showTimesInMinutes) {
      const minutes = Math.floor(timeToArrival / 60);

      // Check if departure is from Motol and under 4 minutes
      const station = stationName.toLowerCase();
      if ((station.includes('motol') && !station.includes('vozovna')) && minutes < 4) {
        return 'Nestíháš';
      }

      if (timeToArrival < 60) {
        // Pod minutou - zobrazit zprávu podle ZASTÁVKY (ne podle cíle)
        if (station.includes('vozovna motol') || station.includes('vozovna')) {
          return 'Stíháš';
        } else if (station.includes('motol') && !station.includes('vozovna')) {
          return 'Nestíháš';
        } else {
          return '<1 min';
        }
      } else {
        return `${minutes} min`;
      }
    } else {
      return new Date(departure.arrival_timestamp * 1000).toLocaleTimeString('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Removed loading state to prevent layout disruption

  if (error) {
    return (
      <Card className="shadow-lg bg-white/90 backdrop-blur-sm h-full border-2 border-gray-300">
        <CardContent className="p-4 text-center h-full flex items-center justify-center">
          <div>
            <AlertTriangle className={`w-12 h-12 mx-auto mb-2 ${isRateLimited ? 'text-orange-500' : 'text-red-500'}`} />
            <p className="text-gray-700 mb-2 text-lg" style={{ fontSize: `${1.25 * 1.0}rem` }}>{error}</p>
            <p className="text-gray-600 text-base" style={{ fontSize: `${1 * 1.0}rem` }}>
              Další pokus za {Math.round(retryDelay / 1000)} sekund
            </p>
            {isRateLimited && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800 text-sm" style={{ fontSize: `${0.8 * 1.0}rem` }}>
                  API má omezený počet požadavků za minutu.<br/>
                  Automaticky zkusím znovu za chvíli.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Limit departures to exactly 7 items
  const limitedDepartures = departures.slice(0, 7);

  return (
    <Card className="shadow-lg bg-white/90 h-full border-2 border-gray-300 flex flex-col min-h-full overflow-hidden">
      <CardContent
        className="flex-1 p-2 flex flex-col min-h-full"
        style={{ paddingTop: `${0.5 * 1.0}rem` }}
      >
        <div className="flex-1 flex flex-col">
        {limitedDepartures.length === 0 && !isUpdating && !loading ? (
          <div className="text-center py-8 text-gray-600 flex-1 flex items-center justify-center">
            <div>
              <Info className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-2 sm:mb-4 text-gray-400" style={{ width: `${Math.max(3, 4 * 1.0)}rem`, height: `${Math.max(3, 4 * 1.0)}rem` }} />
              <p style={{ fontSize: `${Math.max(1.8, 2.8 * 1.0)}rem` }}>Žádné odjezdy do 30 min</p>
              <p style={{ fontSize: `${Math.max(1.4, 2.2 * 1.0)}rem` }}>Zkontrolujte později</p>
            </div>
          </div>
        ) : (limitedDepartures.length > 0 || isUpdating || loading) ? (
          <div className="flex-1 flex flex-col space-y-1" style={{ minHeight: 0 }}>
            {limitedDepartures.map((departure, index) => {
              const delay = departure.delay || 0;
              const delayInfo = getDelayBadge(delay);
              const approachingInfo = getVehicleTypeInfo(departure);
              const serviceAlerts = getServiceAlerts(departure);
              const timeToArrival = departure.arrival_timestamp - Math.floor(Date.now() / 1000);

              return (
                <div
                  key={`departure-${departure.route_short_name}-${departure.trip_id}-${departure.departure_timestamp}`}
                >
                  <div
                  className="flex flex-col lg:flex-row items-start lg:items-center justify-between rounded-lg border border-gray-100 bg-white relative flex-1 gap-1 sm:gap-2 lg:gap-0"
                  style={{
                    padding: `${Math.max(0.3, 0.6 * 1.0)}rem`,
                    marginBottom: `${0.3 * 1.0}rem`,
                    minHeight: `${Math.max(4, 6 * 1.0)}rem`
                  }}
                >
                  <div className="flex items-center gap-1 sm:gap-2 w-full lg:w-auto" style={{ gap: `${Math.max(0.2, 0.4 * 1.0)}rem` }}>
                    <div className={`rounded-lg flex items-center justify-center ${getRouteColor(departure.route_type)}`}
                         style={{
                           width: departure.route_short_name.length > 2 ?
                             `${Math.max(3.5, 5.25 * 1.0)}rem` :
                             `${Math.max(3.0, 4.5 * 1.0)}rem`,
                           height: `${Math.max(3.0, 4.5 * 1.0)}rem`,
                           minWidth: departure.route_short_name.length > 2 ?
                             `${Math.max(3.5, 5.25 * 1.0)}rem` :
                             `${Math.max(3.0, 4.5 * 1.0)}rem`
                         }}>
                      <span className="font-bold" style={{
                        fontSize: departure.route_short_name.length > 2 ?
                          `${Math.max(1.25, 2.25 * 1.0)}rem` :
                          `${Math.max(1.5, 3.0 * 1.0)}rem`
                      }}>
                        {departure.route_short_name}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-1" style={{ marginBottom: `${0.1 * 1.0}rem` }}>
                        <div className="flex items-center gap-1 flex-wrap" style={{ gap: `${0.4 * 1.0}rem` }}>
                          <span className="font-bold text-gray-900" style={{ fontSize: `${Math.max(1.6, 2.8 * 1.0)}rem` }}>
                            {getDirectionDisplay(departure)}
                          </span>
                          {departure.wheelchair_accessible && (
                            <i className="fas fa-wheelchair text-blue-600" style={{ fontSize: `${Math.max(0.9, 1.4 * 1.0)}rem` }}></i>
                          )}
                          {departure.low_floor && (
                            <span className="text-green-600 font-bold text-sm bg-green-100 px-1 rounded" style={{ fontSize: `${Math.max(0.7, 1.2 * 1.0)}rem` }}>NP</span>
                          )}
                          {hasAirConditioning(departure) && (
                            <i className="fas fa-snowflake text-blue-500" style={{ fontSize: `${Math.max(0.9, 1.4 * 1.0)}rem` }} title="Klimatizace"></i>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 text-gray-600" style={{
                        fontSize: `${Math.max(0.7, 1.2 * 1.0)}rem`,
                        gap: `${Math.max(0.2, 0.3 * 1.0)}rem`
                      }}>
                        <div className="flex items-center gap-1" style={{ gap: `${0.3 * 1.0}rem` }}>
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" style={{ width: `${Math.max(0.6, 1.2 * 1.0)}rem`, height: `${Math.max(0.6, 1.2 * 1.0)}rem` }} />
                          {formatTime(timeToArrival)}
                        </div>
                        <div className="flex items-center gap-1" style={{ gap: `${0.3 * 1.0}rem` }}>
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4" style={{ width: `${Math.max(0.6, 1.2 * 1.0)}rem`, height: `${Math.max(0.6, 1.2 * 1.0)}rem` }} />
                          <span className="max-w-full" title={departure.current_stop || 'Poloha neznámá'}>
                            {departure.current_stop || 'Poloha neznámá'}
                          </span>
                        </div>
                      </div>


                      {serviceAlerts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1" style={{ 
                          gap: `${0.4 * 1.0}rem`,
                          marginTop: `${0.2 * 1.0}rem`
                        }}>
                          {serviceAlerts.map((alert, alertIndex) => (
                            <Badge key={alertIndex} className={`${alert.color} flex items-center gap-1`} 
                                   style={{ 
                                     fontSize: `${1.0 * 1.0}rem`,
                                     padding: `${0.3 * 1.0}rem ${0.5 * 1.0}rem`,
                                     gap: `${0.2 * 1.0}rem`
                                   }}>
                              {alert.icon}
                              <span>{alert.text}</span>
                            </Badge>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>

                  <div className="text-center lg:text-right flex-shrink-0 relative w-full lg:w-auto flex flex-col items-center lg:items-end" style={{ gap: `${Math.max(0.2, 0.3 * 1.0)}rem` }}>
                    <div className="flex items-center gap-2">
                      {/* Show "Stíháš" or "Nestíháš" to the left of time */}
                      {showTimesInMinutes && timeToArrival < 240 && (
                        <div className="font-black" style={{
                          fontSize: `${Math.max(2.2, 4.0 * 1.0)}rem`,
                          color: formatDisplayTime(departure).includes('Nestíháš') ? '#dc2626' : '#16a34a'
                        }}>
                          {formatDisplayTime(departure).includes('Stíháš') || formatDisplayTime(departure).includes('Nestíháš') ? formatDisplayTime(departure) : ''}
                        </div>
                      )}

                      <div className="font-black text-gray-900" style={{ fontSize: `${Math.max(2.2, 4.0 * 1.0)}rem` }}>
                        {showTimesInMinutes && (formatDisplayTime(departure).includes('Stíháš') || formatDisplayTime(departure).includes('Nestíháš'))
                          ? ''
                          : formatDisplayTime(departure)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {approachingInfo && (
                        <Badge className="bg-green-100 text-green-800 justify-center lg:justify-start"
                               style={{
                                 fontSize: `${Math.max(0.5, 0.8 * 1.0)}rem`,
                                 padding: `${Math.max(0.1, 0.2 * 1.0)}rem ${Math.max(0.2, 0.4 * 1.0)}rem`
                               }}>
                          Blíží se
                        </Badge>
                      )}
                      <Badge className={`${delayInfo.color} justify-center lg:justify-start`}
                             style={{
                               fontSize: `${Math.max(0.5, 0.8 * 1.0)}rem`,
                               padding: `${Math.max(0.1, 0.2 * 1.0)}rem ${Math.max(0.2, 0.4 * 1.0)}rem`
                             }}>
                        {delayInfo.text}
                      </Badge>
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}

            {/* Add empty flex items to fill remaining space when there are fewer departures */}
            {Array.from({ length: Math.max(0, 5 - limitedDepartures.length) }).map((_, index) => (
              <div key={`empty-${index}`} className="flex-1" style={{ minHeight: `${Math.max(3, 4 * 1.0)}rem` }} />
            ))}
          </div>
        ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export const TramDepartures = memo(TramDeparturesComponent);
