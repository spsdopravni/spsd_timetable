import { useState, useEffect } from "react";
import { Clock, AlertTriangle, Info, Snowflake, Car, MapPin, Wrench, Bus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDepartures } from "@/utils/pidApi";
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
      } else {
        setError("Chyba při načítání odjezdů");
        setRetryDelay(120000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      <CardHeader className="pb-2 flex-shrink-0" style={{ paddingBottom: `${0.5 * textSize}rem` }}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800" style={{ fontSize: `${2.8 * textSize}rem` }}>
            {customTitle || "Odjezdy (Do 30 Min.)"}
          </CardTitle>
          <div className="text-gray-500 flex items-center gap-2" style={{ fontSize: `${1.6 * textSize}rem` }}>
            <Clock className="w-5 h-5" style={{ width: `${2 * textSize}rem`, height: `${2 * textSize}rem` }} />
            Aktualizováno {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2 overflow-hidden flex flex-col">
        {limitedDepartures.length === 0 ? (
          <div className="text-center py-8 text-gray-600 flex-1 flex items-center justify-center">
            <div>
              <Info className="w-20 h-20 mx-auto mb-4 text-gray-400" style={{ width: `${6 * textSize}rem`, height: `${6 * textSize}rem` }} />
              <p style={{ fontSize: `${2.4 * textSize}rem` }}>Žádné odjezdy do 30 min</p>
              <p style={{ fontSize: `${1.8 * textSize}rem` }}>Zkontrolujte později</p>
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
                  className="flex items-center justify-between rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 bg-white relative flex-1"
                  style={{ 
                    padding: `${0.6 * textSize}rem`,
                    marginBottom: `${0.3 * textSize}rem`,
                    minHeight: `${6 * textSize}rem`
                  }}
                >
                  <div className="flex items-center gap-2" style={{ gap: `${0.6 * textSize}rem` }}>
                    <div className={`rounded-lg flex items-center justify-center ${getRouteColor(departure.route_type)}`} 
                         style={{ 
                           width: `${4.5 * textSize}rem`,
                           height: `${4.5 * textSize}rem`,
                           minWidth: `${4.5 * textSize}rem`
                         }}>
                      <span className="font-bold" style={{ fontSize: `${2.4 * textSize}rem` }}>
                        {departure.route_short_name}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1" style={{ marginBottom: `${0.2 * textSize}rem` }}>
                        <div className="flex items-center gap-1" style={{ gap: `${0.4 * textSize}rem` }}>
                          <span className="font-semibold text-gray-800" style={{ fontSize: `${1.8 * textSize}rem` }}>
                            {getDirectionDisplay(departure)}
                          </span>
                          {departure.wheelchair_accessible && (
                            <span className="text-blue-600" style={{ fontSize: `${1.6 * textSize}rem` }}>♿</span>
                          )}
                          
                          {serviceAlerts.map((alert, alertIndex) => (
                            <div key={alertIndex} className="flex items-center" title={alert.text}>
                              {alert.icon}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600" style={{ 
                        fontSize: `${1.4 * textSize}rem`,
                        gap: `${0.4 * textSize}rem`
                      }}>
                        <div className="flex items-center gap-1" style={{ gap: `${0.3 * textSize}rem` }}>
                          <Clock className="w-4 h-4" style={{ width: `${1.6 * textSize}rem`, height: `${1.6 * textSize}rem` }} />
                          {formatTime(timeToArrival)}
                        </div>
                      </div>

                      <div className="text-gray-500" style={{ 
                        fontSize: `${1.2 * textSize}rem`
                      }}>
                        <div className="flex items-center gap-2 flex-wrap" style={{ gap: `${0.5 * textSize}rem` }}>
                          {departure.vehicle_number && departure.trip_id && (
                            <div className="flex items-center gap-1" style={{ gap: `${0.3 * textSize}rem` }}>
                              <Car className="w-3 h-3" style={{ width: `${1.3 * textSize}rem`, height: `${1.3 * textSize}rem` }} />
                              <span>#{departure.vehicle_number}</span>
                            </div>
                          )}
                          {departure.current_stop && (
                            <div className="flex items-center gap-1" style={{ gap: `${0.3 * textSize}rem` }}>
                              <MapPin className="w-3 h-3" style={{ width: `${1.3 * textSize}rem`, height: `${1.3 * textSize}rem` }} />
                              <span>{departure.current_stop}</span>
                            </div>
                          )}
                        </div>
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

                      {/* Approaching vehicle notification positioned in the red circled area */}
                      {approachingInfo && (
                        <div className="absolute top-2 right-20 z-10">
                          <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg border-2 border-green-400" 
                               style={{ 
                                 fontSize: `${1.0 * textSize}rem`,
                                 padding: `${0.3 * textSize}rem ${0.8 * textSize}rem`
                               }}>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                              Blíží se!
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-1 flex-shrink-0 relative" style={{ gap: `${0.3 * textSize}rem` }}>
                    <div className="font-bold text-gray-800" style={{ fontSize: `${2.8 * textSize}rem` }}>
                      {formatDisplayTime(departure)}
                    </div>
                    
                    <Badge className={`${delayInfo.color}`} 
                           style={{ 
                             fontSize: `${1.0 * textSize}rem`,
                             padding: `${0.3 * textSize}rem ${0.5 * textSize}rem`
                           }}>
                      {delayInfo.text}
                    </Badge>
                  </div>
                </div>
              );
            })}
            
            {/* Add empty flex items to fill remaining space when there are fewer departures */}
            {Array.from({ length: Math.max(0, 5 - limitedDepartures.length) }).map((_, index) => (
              <div key={`empty-${index}`} className="flex-1" style={{ minHeight: `${6 * textSize}rem` }} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
