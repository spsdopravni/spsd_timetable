import { useState, useEffect } from "react";
import { Clock, AlertTriangle, Info, Snowflake, Car, MapPin, Wrench, Bus, Wind, Wifi, Accessibility, Bike, Zap, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDepartures, setThirdApiKey } from "@/utils/pidApi";
import type { Departure } from "@/types/pid";

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
      
      const data = await getDepartures(stationId);
      
      if (data.length === 0 && retryCount < 3) {
        console.log(`⚠️ No data received, scheduling retry ${retryCount + 1}/3`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchDepartures(true), 5000);
        return;
      }
      
      setDepartures(data);
      setLastUpdate(new Date());
      setRetryDelay(60000);
      setRetryCount(0);
      console.log(`✅ Successfully loaded ${data.length} departures`);
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
    }
  };

  useEffect(() => {
    // Přidáme globální funkci pro nastavení třetího API klíče (pokud není nastaven)
    (window as any).setThirdApiKey = setThirdApiKey;

    const stationChanged = JSON.stringify(previousStationId) !== JSON.stringify(stationId);

    if (stationChanged) {
      console.log(`🔄 Station changed from ${JSON.stringify(previousStationId)} to ${JSON.stringify(stationId)}`);
      setLoading(true);
      setRetryCount(0);
      setPreviousStationId(stationId);
      fetchDepartures();
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

  if (loading) {
    return (
      <Card className="shadow-lg bg-white/90 backdrop-blur-sm h-full border-2 border-gray-300">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-700 mb-2 text-xl" style={{ fontSize: `${1.5 * textSize}rem` }}>Načítám odjezdy...</p>
            {retryCount > 0 && (
              <p className="text-gray-600 text-base" style={{ fontSize: `${1 * textSize}rem` }}>Pokus {retryCount}/3</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

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
      <CardContent className="flex-1 p-2 overflow-hidden flex flex-col" style={{ paddingTop: `${0.5 * textSize}rem` }}>
        {limitedDepartures.length === 0 ? (
          <div className="text-center py-8 text-gray-600 flex-1 flex items-center justify-center">
            <div>
              <Info className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-2 sm:mb-4 text-gray-400" style={{ width: `${Math.max(3, 4 * textSize)}rem`, height: `${Math.max(3, 4 * textSize)}rem` }} />
              <p style={{ fontSize: `${Math.max(1.8, 2.8 * textSize)}rem` }}>Žádné odjezdy do 30 min</p>
              <p style={{ fontSize: `${Math.max(1.4, 2.2 * textSize)}rem` }}>Zkontrolujte později</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-1" style={{ minHeight: 0 }}>
            {limitedDepartures.map((departure, index) => {
              const delay = departure.delay || 0;
              const delayInfo = getDelayBadge(delay);
              const approachingInfo = getVehicleTypeInfo(departure);
              const serviceAlerts = getServiceAlerts(departure);
              const timeToArrival = departure.arrival_timestamp - Math.floor(Date.now() / 1000);
              
              return (
                <div
                  key={index}
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
                           width: `${Math.max(2.0, 3.0 * textSize)}rem`,
                           height: `${Math.max(2.0, 3.0 * textSize)}rem`,
                           minWidth: `${Math.max(2.0, 3.0 * textSize)}rem`
                         }}>
                      <span className="font-bold" style={{ fontSize: `${Math.max(1.2, 2.4 * textSize)}rem` }}>
                        {departure.route_short_name}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-1" style={{ marginBottom: `${0.1 * textSize}rem` }}>
                        <div className="flex items-center gap-1 flex-wrap" style={{ gap: `${0.4 * textSize}rem` }}>
                          <span className="font-semibold text-gray-800" style={{ fontSize: `${Math.max(1.2, 2.2 * textSize)}rem` }}>
                            {getDirectionDisplay(departure)}
                          </span>
                          {departure.wheelchair_accessible && (
                            <i className="fas fa-wheelchair text-blue-600" style={{ fontSize: `${Math.max(0.7, 1.2 * textSize)}rem` }}></i>
                          )}
                          {departure.air_conditioning && (
                            <div className="flex items-center" title="Klimatizace">
                              <Snowflake className="text-cyan-600" style={{ width: `${Math.max(1.2, 1.8 * textSize)}rem`, height: `${Math.max(1.2, 1.8 * textSize)}rem` }} />
                            </div>
                          )}
                          {departure.wifi && (
                            <div className="flex items-center" title="WiFi">
                              <Wifi className="text-blue-600" style={{ width: `${Math.max(1.2, 1.8 * textSize)}rem`, height: `${Math.max(1.2, 1.8 * textSize)}rem` }} />
                            </div>
                          )}
                          {departure.low_floor && (
                            <div className="flex items-center" title="Nízká podlaha">
                              <Accessibility className="text-green-600" style={{ width: `${Math.max(1.2, 1.8 * textSize)}rem`, height: `${Math.max(1.2, 1.8 * textSize)}rem` }} />
                            </div>
                          )}
                          {departure.bike_rack && (
                            <div className="flex items-center" title="Stojan na kola">
                              <Bike className="text-orange-600" style={{ width: `${Math.max(1.2, 1.8 * textSize)}rem`, height: `${Math.max(1.2, 1.8 * textSize)}rem` }} />
                            </div>
                          )}
                          {departure.usb_charging && (
                            <div className="flex items-center" title="USB nabíjení">
                              <Zap className="text-yellow-600" style={{ width: `${Math.max(1.2, 1.8 * textSize)}rem`, height: `${Math.max(1.2, 1.8 * textSize)}rem` }} />
                            </div>
                          )}

                          {serviceAlerts.map((alert, alertIndex) => (
                            <div key={alertIndex} className="flex items-center" title={alert.text}>
                              {alert.icon}
                            </div>
                          ))}
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
                      </div>

                      {/* Zobrazí informace o vozidle pouze pokud jsou k dispozici */}
                      {(departure.vehicle_number || departure.vehicle_model || departure.vehicle_age || departure.current_stop || departure.vehicle_type) && (
                        <div className="text-gray-500" style={{
                          fontSize: `${Math.max(0.7, 1.0 * textSize)}rem`
                        }}>
                          <div className="space-y-1" style={{ gap: `${Math.max(0.2, 0.3 * textSize)}rem` }}>

                          {/* Číslo a typ vozidla */}
                          <div className="flex flex-wrap gap-3" style={{ gap: `${Math.max(0.4, 0.6 * textSize)}rem` }}>
                            {departure.vehicle_number && (
                              <div className="flex items-center gap-1" style={{ gap: `${0.2 * textSize}rem` }}>
                                <Car className="w-3 h-3 text-blue-600" style={{ width: `${Math.max(0.7, 1.0 * textSize)}rem`, height: `${Math.max(0.7, 1.0 * textSize)}rem` }} />
                                <span className="text-gray-600">Voz. č.:</span>
                                <span className="font-bold text-blue-700">{formatVehicleNumber(departure.vehicle_number, departure.route_short_name, departure.trip_number)}</span>
                              </div>
                            )}
                            {departure.vehicle_operator && (
                              <div className="flex items-center gap-1" style={{ gap: `${0.2 * textSize}rem` }}>
                                <span className="text-gray-600">Operátor:</span>
                                <span className="font-bold text-blue-600">{departure.vehicle_operator}</span>
                              </div>
                            )}
                            {departure.vehicle_type && (
                              <div className="flex items-center gap-1" style={{ gap: `${0.2 * textSize}rem` }}>
                                <span className="text-gray-600">Typ:</span>
                                <span className="font-bold text-green-700">{departure.vehicle_type}</span>
                              </div>
                            )}
                          </div>

                          {/* Stáří a pozice */}
                          <div className="flex flex-wrap gap-3" style={{ gap: `${Math.max(0.4, 0.6 * textSize)}rem` }}>
                            {departure.vehicle_age && (
                              <div className="flex items-center gap-1" style={{ gap: `${0.2 * textSize}rem` }}>
                                <Calendar className="w-3 h-3 text-orange-600" style={{ width: `${Math.max(0.7, 1.0 * textSize)}rem`, height: `${Math.max(0.7, 1.0 * textSize)}rem` }} />
                                <span className="text-gray-600">Stáří:</span>
                                <span className="font-medium">{departure.vehicle_age} let</span>
                              </div>
                            )}
                            {departure.current_stop && (
                              <div className="flex items-center gap-1" style={{ gap: `${0.2 * textSize}rem` }}>
                                <MapPin className="w-3 h-3 text-red-600" style={{ width: `${Math.max(0.7, 1.0 * textSize)}rem`, height: `${Math.max(0.7, 1.0 * textSize)}rem` }} />
                                <span className="text-gray-600">Aktuálně:</span>
                                <span className="font-medium text-red-700">{departure.current_stop}</span>
                              </div>
                            )}
                          </div>

                            {/* Výrobce/provozovatel */}
                            {departure.vehicle_type && (
                              <div className="flex items-center gap-1" style={{ gap: `${0.2 * textSize}rem` }}>
                                <span className="text-gray-600">Výz. obch.:</span>
                                <span className="font-medium">{departure.vehicle_type}</span>
                              </div>
                            )}
                          </div>

                          {/* Technické údaje - jen dostupné z API */}
                          {(departure.trip_id || departure.route_type || departure.platform_code) && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-xs font-semibold text-blue-600 mb-1">🎓 Technické údaje</div>
                              <div className="flex flex-wrap gap-2 text-xs" style={{ gap: `${Math.max(0.3, 0.4 * textSize)}rem`, fontSize: `${Math.max(0.6, 0.8 * textSize)}rem` }}>
                                {departure.trip_id && (
                                  <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">Trip ID: {departure.trip_id}</span>
                                )}
                                {departure.route_type !== undefined && (
                                  <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                                    Typ: {departure.route_type === 0 ? 'Tramvaj' : departure.route_type === 1 ? 'Metro' : departure.route_type === 3 ? 'Autobus' : `Type ${departure.route_type}`}
                                  </span>
                                )}
                                {departure.platform_code && (
                                  <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded">Nástupiště: {departure.platform_code}</span>
                                )}
                                {departure.shape_id && (
                                  <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">Shape: {departure.shape_id}</span>
                                )}
                                {departure.bearing !== undefined && (
                                  <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded">Směr: {departure.bearing}°</span>
                                )}
                                {departure.state_position && (
                                  <span className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded">Pozice: {departure.state_position}</span>
                                )}
                                {departure.real_time_delay !== undefined && departure.real_time_delay > 0 && (
                                  <span className="bg-red-50 text-red-700 px-2 py-1 rounded">Real-time zpoždění: {Math.round(departure.real_time_delay/60)} min</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

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
                    <div className="font-bold text-gray-800" style={{ fontSize: `${Math.max(1.4, 2.8 * textSize)}rem` }}>
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
              );
            })}
            
            {/* Add empty flex items to fill remaining space when there are fewer departures */}
            {Array.from({ length: Math.max(0, 5 - limitedDepartures.length) }).map((_, index) => (
              <div key={`empty-${index}`} className="flex-1" style={{ minHeight: `${Math.max(3, 4 * textSize)}rem` }} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
