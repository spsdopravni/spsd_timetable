import { useState, useEffect } from "react";
import { Clock, AlertTriangle, Info, Snowflake, Car, MapPin, Wrench, Bus, Wind, Wifi, Accessibility, Bike, Zap, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDepartures, setThirdApiKey } from "@/utils/pidApi";
import type { Departure } from "@/types/pid";
import { TransitionGroup, CSSTransition } from "react-transition-group";

interface TramDeparturesProps {
  stationId: string | string[];
  textSize?: number;
  maxItems?: number;
  customTitle?: string;
  showTimesInMinutes?: boolean;
}

export const TramDepartures = ({ stationId, textSize = 1.0, maxItems = 5, customTitle, showTimesInMinutes = false }: TramDeparturesProps) => {
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

  const fetchDepartures = async (isRetry = false) => {
    try {
      setError(null);
      setIsRateLimited(false);
      
      console.log(`🔄 Fetching departures for station: ${Array.isArray(stationId) ? stationId.join(',') : stationId} (retry: ${isRetry})`);

      const result = await getDepartures(stationId);
      const { departures: departuresData } = result;

      if (departuresData.length === 0 && retryCount < 3) {
        console.log(`⚠️ No data received, scheduling retry ${retryCount + 1}/3`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchDepartures(true), 5000);
        return;
      }

      setDepartures(departuresData);
      setLastUpdate(new Date());
      setRetryDelay(60000);
      setRetryCount(0);
      setIsUpdating(false);
      console.log(`✅ Successfully loaded ${departuresData.length} departures`);
    } catch (error: any) {
      console.error("Error fetching departures:", error);
      
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
      console.log(`🔄 Station changed from ${JSON.stringify(previousStationId)} to ${JSON.stringify(stationId)}`);
      setIsUpdating(true);
      setRetryCount(0);
      setPreviousStationId(stationId);

      // Preload data first
      const preloadData = async () => {
        try {
          const result = await getDepartures(stationId);
          setNextDepartures(result.departures);

          // Small delay to ensure smooth transition
          setTimeout(() => {
            setDepartures(result.departures);
            setLastUpdate(new Date());
            setIsUpdating(false);
          }, 100);
        } catch (error) {
          // If preload fails, fall back to normal fetch
          fetchDepartures();
        }
      };

      preloadData();
    }
  }, [stationId]);

  useEffect(() => {
    if (JSON.stringify(previousStationId) === JSON.stringify(stationId)) {
      const interval = setInterval(() => {
        console.log(`⏰ Regular fetch for station: ${Array.isArray(stationId) ? stationId.join(',') : stationId}`);
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
    if (delay <= 60) return { text: `+${Math.floor(delay / 60)} min`, color: "bg-yellow-100 text-yellow-800" };
    return { text: `+${Math.floor(delay / 60)} min`, color: "bg-red-100 text-red-800" };
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
    return departure.headsign;
  };

  const getServiceAlerts = (departure: Departure) => {
    const alerts = [];

    const headsign = departure.headsign?.toLowerCase() || '';

    const isShortened = headsign.includes('jen do') || headsign.includes('pouze do');
    const isToDepot = headsign.includes('vozovna') && !headsign.includes('ústředn');

    // Klimatizace se zobrazuje jako ikona vedle názvu, takže ji nepotřebujeme v alerts
    // if (departure.air_conditioning) {
    //   alerts.push({
    //     icon: <Snowflake className="w-5 h-5 text-cyan-600" style={{ width: `${1.5 * textSize}rem`, height: `${1.5 * textSize}rem` }} />,
    //     text: "Klimatizace",
    //     color: "bg-cyan-100 text-cyan-800"
    //   });
    // }

    if (departure.wifi) {
      alerts.push({
        icon: <Wifi className="w-5 h-5 text-blue-600" style={{ width: `${1.5 * textSize}rem`, height: `${1.5 * textSize}rem` }} />,
        text: "WiFi",
        color: "bg-blue-100 text-blue-800"
      });
    }

    if (departure.low_floor) {
      alerts.push({
        icon: <Accessibility className="w-5 h-5 text-green-600" style={{ width: `${1.5 * textSize}rem`, height: `${1.5 * textSize}rem` }} />,
        text: "Nízká podlaha",
        color: "bg-green-100 text-green-800"
      });
    }

    if (departure.usb_charging) {
      alerts.push({
        icon: <Zap className="w-5 h-5 text-yellow-600" style={{ width: `${1.5 * textSize}rem`, height: `${1.5 * textSize}rem` }} />,
        text: "USB nabíjení",
        color: "bg-yellow-100 text-yellow-800"
      });
    }

    if (departure.bike_rack) {
      alerts.push({
        icon: <Bike className="w-5 h-5 text-orange-600" style={{ width: `${1.5 * textSize}rem`, height: `${1.5 * textSize}rem` }} />,
        text: "Stojan na kola",
        color: "bg-orange-100 text-orange-800"
      });
    }

    if (isShortened) {
      alerts.push({
        icon: <AlertTriangle className="w-5 h-5 text-yellow-600" style={{ width: `${1.5 * textSize}rem`, height: `${1.5 * textSize}rem` }} />,
        text: "Zkrácená jízda",
        color: "bg-yellow-100 text-yellow-800"
      });
    }

    if (isToDepot) {
      alerts.push({
        icon: <Wrench className="w-5 h-5 text-orange-600" style={{ width: `${1.5 * textSize}rem`, height: `${1.5 * textSize}rem` }} />,
        text: "Jízda do vozovny",
        color: "bg-orange-100 text-orange-800"
      });
    }

    if (departure.alert_hash) {
      if (departure.alert_hash === 'canceled') {
        alerts.push({
          icon: <AlertTriangle className="w-5 h-5 text-red-600" style={{ width: `${1.5 * textSize}rem`, height: `${1.5 * textSize}rem` }} />,
          text: "Zrušeno",
          color: "bg-red-100 text-red-800"
        });
      } else {
        alerts.push({
          icon: <Info className="w-5 h-5 text-blue-600" style={{ width: `${1.5 * textSize}rem`, height: `${1.5 * textSize}rem` }} />,
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
      if (timeToArrival < 60) {
        return `${timeToArrival}s`;
      } else {
        const minutes = Math.floor(timeToArrival / 60);
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
            <p className="text-gray-700 mb-2 text-lg" style={{ fontSize: `${1.25 * textSize}rem` }}>{error}</p>
            <p className="text-gray-600 text-base" style={{ fontSize: `${1 * textSize}rem` }}>
              Další pokus za {Math.round(retryDelay / 1000)} sekund
            </p>
            {isRateLimited && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800 text-sm" style={{ fontSize: `${0.8 * textSize}rem` }}>
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

  // Limit departures to exactly 5 items
  const limitedDepartures = departures.slice(0, 5);

  return (
    <Card className="shadow-lg bg-white/90 backdrop-blur-sm h-full border-2 border-gray-300 flex flex-col">
      <CardContent
        className={`flex-1 p-2 overflow-hidden flex flex-col transition-all duration-500 ease-in-out ${isUpdating ? 'opacity-70 scale-[0.98]' : 'opacity-100 scale-100'}`}
        style={{ paddingTop: `${0.5 * textSize}rem` }}
      >
        {limitedDepartures.length === 0 && !isUpdating ? (
          <div className="text-center py-8 text-gray-600 flex-1 flex items-center justify-center">
            <div>
              <Info className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-2 sm:mb-4 text-gray-400" style={{ width: `${Math.max(3, 4 * textSize)}rem`, height: `${Math.max(3, 4 * textSize)}rem` }} />
              <p style={{ fontSize: `${Math.max(1.8, 2.8 * textSize)}rem` }}>Žádné odjezdy do 30 min</p>
              <p style={{ fontSize: `${Math.max(1.4, 2.2 * textSize)}rem` }}>Zkontrolujte později</p>
            </div>
          </div>
        ) : limitedDepartures.length > 0 ? (
          <div className="flex-1 flex flex-col space-y-1" style={{ minHeight: 0 }}>
            <TransitionGroup component={null}>
              {limitedDepartures.map((departure, index) => {
              const delay = departure.delay || 0;
              const delayInfo = getDelayBadge(delay);
              const approachingInfo = getVehicleTypeInfo(departure);
              const serviceAlerts = getServiceAlerts(departure);
              const timeToArrival = departure.arrival_timestamp - Math.floor(Date.now() / 1000);

              // Debug log pro klimatizaci a aktuální zastávku
              if (index === 0) {
                console.log('🚌 Departure data - stejně jako low_floor:', {
                  route: departure.route_short_name,
                  air_conditioning: departure.air_conditioning,
                  current_stop: departure.current_stop,
                  wheelchair_accessible: departure.wheelchair_accessible,
                  low_floor: departure.low_floor,
                  headsign: departure.headsign
                });
              }
              
              return (
                <CSSTransition
                  key={`${departure.route_short_name}-${departure.departure_timestamp}-${index}`}
                  timeout={300}
                  classNames="departure"
                >
                  <div
                  className="flex flex-col lg:flex-row items-start lg:items-center justify-between rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 bg-white relative flex-1 gap-1 sm:gap-2 lg:gap-0"
                  style={{
                    padding: `${Math.max(0.3, 0.6 * textSize)}rem`,
                    marginBottom: `${0.3 * textSize}rem`,
                    minHeight: `${Math.max(4, 6 * textSize)}rem`
                  }}
                >
                  <div className="flex items-center gap-1 sm:gap-2 w-full lg:w-auto" style={{ gap: `${Math.max(0.2, 0.4 * textSize)}rem` }}>
                    <div className={`rounded-lg flex items-center justify-center ${getRouteColor(departure.route_type)}`}
                         style={{
                           width: departure.route_short_name.length > 2 ?
                             `${Math.max(2.8, 4.2 * textSize)}rem` :
                             `${Math.max(2.4, 3.6 * textSize)}rem`,
                           height: `${Math.max(2.4, 3.6 * textSize)}rem`,
                           minWidth: departure.route_short_name.length > 2 ?
                             `${Math.max(2.8, 4.2 * textSize)}rem` :
                             `${Math.max(2.4, 3.6 * textSize)}rem`
                         }}>
                      <span className="font-bold" style={{
                        fontSize: departure.route_short_name.length > 2 ?
                          `${Math.max(1.0, 1.8 * textSize)}rem` :
                          `${Math.max(1.2, 2.4 * textSize)}rem`
                      }}>
                        {departure.route_short_name}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-1" style={{ marginBottom: `${0.1 * textSize}rem` }}>
                        <div className="flex items-center gap-1 flex-wrap" style={{ gap: `${0.4 * textSize}rem` }}>
                          <span className="font-bold text-gray-900" style={{ fontSize: `${Math.max(1.6, 2.8 * textSize)}rem` }}>
                            {getDirectionDisplay(departure)}
                          </span>
                          {departure.wheelchair_accessible && (
                            <i className="fas fa-wheelchair text-blue-600" style={{ fontSize: `${Math.max(0.9, 1.4 * textSize)}rem` }}></i>
                          )}
                          {departure.low_floor && (
                            <span className="text-green-600 font-bold text-sm bg-green-100 px-1 rounded" style={{ fontSize: `${Math.max(0.7, 1.2 * textSize)}rem` }}>NP</span>
                          )}
                          {hasAirConditioning(departure) && (
                            <i className="fas fa-snowflake text-blue-500" style={{ fontSize: `${Math.max(0.9, 1.4 * textSize)}rem` }} title="Klimatizace"></i>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 text-gray-600" style={{
                        fontSize: `${Math.max(0.7, 1.2 * textSize)}rem`,
                        gap: `${Math.max(0.2, 0.3 * textSize)}rem`
                      }}>
                        <div className="flex items-center gap-1" style={{ gap: `${0.3 * textSize}rem` }}>
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" style={{ width: `${Math.max(0.6, 1.2 * textSize)}rem`, height: `${Math.max(0.6, 1.2 * textSize)}rem` }} />
                          {formatTime(timeToArrival)}
                        </div>
                        {departure.current_stop && (
                          <div className="flex items-center gap-1" style={{ gap: `${0.3 * textSize}rem` }}>
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" style={{ width: `${Math.max(0.6, 1.2 * textSize)}rem`, height: `${Math.max(0.6, 1.2 * textSize)}rem` }} />
                            <span className="max-w-full" title={departure.current_stop}>{departure.current_stop}</span>
                          </div>
                        )}
                      </div>


                      {serviceAlerts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1" style={{ 
                          gap: `${0.4 * textSize}rem`,
                          marginTop: `${0.2 * textSize}rem`
                        }}>
                          {serviceAlerts.map((alert, alertIndex) => (
                            <Badge key={alertIndex} className={`${alert.color} flex items-center gap-1`} 
                                   style={{ 
                                     fontSize: `${1.0 * textSize}rem`,
                                     padding: `${0.3 * textSize}rem ${0.5 * textSize}rem`,
                                     gap: `${0.2 * textSize}rem`
                                   }}>
                              {alert.icon}
                              <span>{alert.text}</span>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Approaching vehicle notification */}
                      {approachingInfo && (
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-20 z-10">
                          <div className="bg-green-600 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold animate-pulse shadow-lg border-2 border-green-400"
                               style={{
                                 fontSize: `${Math.max(0.6, 1.0 * textSize)}rem`,
                                 padding: `${Math.max(0.2, 0.3 * textSize)}rem ${Math.max(0.4, 0.8 * textSize)}rem`
                               }}>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                              <span className="hidden sm:inline">Blíží se!</span>
                              <span className="sm:hidden">●</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center lg:text-right space-y-1 flex-shrink-0 relative w-full lg:w-auto" style={{ gap: `${Math.max(0.2, 0.3 * textSize)}rem` }}>
                    <div className="font-black text-gray-900" style={{ fontSize: `${Math.max(2.2, 4.0 * textSize)}rem` }}>
                      {formatDisplayTime(departure)}
                    </div>

                    <Badge className={`${delayInfo.color} justify-center lg:justify-start`}
                           style={{
                             fontSize: `${Math.max(0.5, 0.8 * textSize)}rem`,
                             padding: `${Math.max(0.1, 0.2 * textSize)}rem ${Math.max(0.2, 0.4 * textSize)}rem`
                           }}>
                      {delayInfo.text}
                    </Badge>
                  </div>
                  </div>
                </CSSTransition>
              );
            })}
            </TransitionGroup>

            {/* Add empty flex items to fill remaining space when there are fewer departures */}
            {Array.from({ length: Math.max(0, 5 - limitedDepartures.length) }).map((_, index) => (
              <div key={`empty-${index}`} className="flex-1" style={{ minHeight: `${Math.max(3, 4 * textSize)}rem` }} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500" style={{ fontSize: `${Math.max(1.2, 1.8 * textSize)}rem` }}>
              Načítám odjezdy...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
