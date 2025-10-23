import type { Station, Departure } from "@/types/pid";

const API_BASE = "https://api.golemio.cz";

// API klíče pro různé endpointy
const API_KEY_1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcwNCwiaWF0IjoxNzYwNzkxMjUwLCJleHAiOjExNzYwNzkxMjUwLCJpc3MiOiJnb2xlbWlvIiwianRpIjoiM2Y4MWJiMjItM2YxNC00ODgxLThlMDYtYjQ1YmRlOTYzZjk3In0.BR0653y2bfG0zxdkOYvDgvywRR9Z9nXB4NlatJXR38A";
const API_KEY_2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcwNywiaWF0IjoxNzYwNzkxMjc4LCJleHAiOjExNzYwNzkxMjc4LCJpc3MiOiJnb2xlbWlvIiwianRpIjoiN2U2ZTViOWMtYjkyOS00NzZlLTk0MmItYTY4NzdkM2M2MjNjIn0._K4k4Mrfy1_cWiy3Za_DRrCOX4gfbrz8p0rVZypVFq8";
let API_KEY_3 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDA0NiwiaWF0IjoxNzYwNzk0NjU3LCJleHAiOjExNzYwNzk0NjU3LCJpc3MiOiJnb2xlbWlvIiwianRpIjoiNzAwZmNkOGYtMzYyOS00MjZjLThmYTgtNTU2YTJlZmE1YmFlIn0.r6hVewQXnk8TaowFb7s7lDveyA6XYYGnxe_qlzUbhZM"; // Třetí API klíč pro rozšířené údaje

// Mapování stanic na API klíče
const STATION_API_MAPPING: {[key: string]: string} = {
  // Vozovna Motol - API klíč 1
  "U865Z1P": API_KEY_1,
  "U865Z2P": API_KEY_1,
  
  // Motol nástupiště C a D - API klíč 2
  "U394Z3P": API_KEY_2,
  "U394Z3": API_KEY_2,
  "U394Z4P": API_KEY_2,
  "U394Z4": API_KEY_2,
};

// Funkce pro nastavení třetího API klíče
export const setThirdApiKey = (key: string) => {
  API_KEY_3 = key;
};

const getApiKeyForStation = (stationId: string): string => {
  // Používáme jen API_KEY_1 a API_KEY_2 pro departures, ne třetí klíč!
  const key = STATION_API_MAPPING[stationId] || API_KEY_1;
  // Pokud je klíč prázdný, vraťme placeholder - API nebude fungovat
  if (!key || key.trim() === '') {
    return 'MISSING_API_KEY';
  }
  // NIKDY nepoužívej API_KEY_3 pro departures!
  if (key === API_KEY_3) {
    return API_KEY_1;
  }
  return key;
};

const getHeadersForStation = (stationId: string) => ({
  "X-Access-Token": getApiKeyForStation(stationId),
  "Content-Type": "application/json"
});

// Headers pro extended data odstraněny

// Vehicle enrichment funkce odstraněna

export const searchStations = async (query: string): Promise<Station[]> => {
  try {
    const headers = {
      "X-Access-Token": API_KEY_1,
      "Content-Type": "application/json"
    };
    
    const response = await fetch(
      `${API_BASE}/pid/gtfs/stops?names=${encodeURIComponent(query)}&limit=20`,
      { headers }
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    return data.stops || [];
  } catch (error) {
    return [];
  }
};

export const getRouteStops = async (routeId: string): Promise<string[]> => {
  return [];
};

export const getStationRoutes = async (stationId: string): Promise<any[]> => {
  try {
    const headers = getHeadersForStation(stationId);
    
    const response = await fetch(
      `${API_BASE}/v2/pid/gtfs/stops/${stationId}/routes`,
      { headers }
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (data.routes && Array.isArray(data.routes)) {
      return data.routes;
    }
    
    return [];
  } catch (error) {
    return [];
  }
};

export const getTransferOptions = async (stationName: string): Promise<string[]> => {
  try {
    const stations = await searchStations(stationName);
    if (stations.length === 0) return [];
    
    const stationId = stations[0].id;
    const routes = await getStationRoutes(stationId);
    
    const transfers = routes
      .filter(route => {
        const routeNum = route.short_name;
        const routeType = route.type;
        
        if (routeType === 1) return true;
        if (routeType === 0) return true;
        if (routeType === 3) {
          const num = parseInt(routeNum);
          return !isNaN(num) && num < 200;
        }
        
        return false;
      })
      .map(route => {
        const type = route.type === 1 ? '🚇' : route.type === 0 ? '🚋' : '🚌';
        return `${route.short_name}${type}`;
      })
      .slice(0, 5);
    
    return transfers;
  } catch (error) {
    return [];
  }
};

const ROUTE_TRANSFERS: {[key: string]: {[key: string]: string[]}} = {
  "9_0": {
    "Anděl": ["B🚇", "149🚌", "191🚌"],
    "I.P.Pavlova": ["A🚇", "C🚇", "11🚋", "4🚌", "6🚌"]
  },
  "10_0": {
    "Anděl": ["B🚇", "149🚌", "191🚌"],
    "I.P.Pavlova": ["A🚇", "C🚇", "11🚋", "4🚌", "6🚌"]
  },
  "16_0": {
    "Arbesovo náměstí": ["12🚋", "20🚋", "57🚋"],
    "Klamovka": ["4🚋", "7🚋", "9🚋"]
  }
};

export const getRouteTransfers = async (routeId: string): Promise<{[key: string]: string[]}> => {
  try {
    
    if (!routeId) {
      return {};
    }
    
    const routeKey = routeId.includes('_') ? routeId : `${routeId}_0`;
    if (ROUTE_TRANSFERS[routeKey]) {
      return ROUTE_TRANSFERS[routeKey];
    }
    
    const baseRoute = routeId.split('_')[0];
    const baseRouteKey = `${baseRoute}_0`;
    if (ROUTE_TRANSFERS[baseRouteKey]) {
      return ROUTE_TRANSFERS[baseRouteKey];
    }
    
    return {};
  } catch (error) {
    return {};
  }
};

export const getDepartures = async (stationIds: string | string[]): Promise<Departure[]> => {
  try {
    const ids = Array.isArray(stationIds) ? stationIds : [stationIds];
    
    
    let allDepartures: any[] = [];
    let allAlerts: any[] = [];
    let workingStations: string[] = [];
    
    // Zkusíme načíst odjezdy postupně pro každé ID s příslušným API klíčem
    for (const stationId of ids) {
      try {
        const headers = getHeadersForStation(stationId);
        const apiKey = getApiKeyForStation(stationId);
        
        // Používáme třetí API klíč pro rozšířená data o vozidlech
        const extendedHeaders = {
          "X-Access-Token": API_KEY_3,
          "Content-Type": "application/json"
        };

        const url = `${API_BASE}/v2/pid/departureboards/?ids=${stationId}&limit=20&minutesBefore=0&minutesAfter=30`;

        const response = await fetch(url, { headers: extendedHeaders });

        if (response.status === 429) {
          continue; // Pokračujeme s dalšími stanicemi
        }

        if (response.status === 401) {
          continue; // Pokračujeme s dalšími stanicemi
        }

        if (response.ok) {
          const data = await response.json();
          
          if (data.departures && Array.isArray(data.departures) && data.departures.length > 0) {
            allDepartures = [...allDepartures, ...data.departures];
            workingStations.push(stationId);
          } else {
          }

          // Shromažďujeme alerts/infotexts
          if (data.infotexts && Array.isArray(data.infotexts) && data.infotexts.length > 0) {
            allAlerts = [...allAlerts, ...data.infotexts];
          }
        } else {
        }
      } catch (stationError: any) {
        continue;
      }
    }
    
    
    if (allDepartures.length === 0) {
      return {
        departures: [],
        alerts: allAlerts
      };
    }
    
    const processedDepartures = allDepartures
      .filter((dep: any) => {
        const isValidRoute = dep.route?.type !== undefined;
        if (!isValidRoute) {
        }
        return isValidRoute;
      })
      .map((dep: any) => {
        
        let arrivalTimestamp: number;
        if (dep.arrival_timestamp?.predicted) {
          arrivalTimestamp = Math.floor(new Date(dep.arrival_timestamp.predicted).getTime() / 1000);
        } else if (dep.arrival_timestamp?.scheduled) {
          arrivalTimestamp = Math.floor(new Date(dep.arrival_timestamp.scheduled).getTime() / 1000);
        } else {
          return null;
        }
        
        let delay = 0;
        if (dep.delay?.seconds) {
          delay = dep.delay.seconds;
        }

        // Správné field names podle API dokumentace
        const vehicleNumber = dep.vehicle?.vehicle_registration_number || dep.vehicle?.registration_number;
        const vehicleOperator = dep.vehicle?.operator;
        const vehicleType = dep.vehicle?.vehicle_type;

        const vehicleModel = dep.vehicle?.sub_type || dep.vehicle?.model || dep.vehicle?.vehicle_type?.short_name;
        const vehicleAge = dep.vehicle?.production_year ? new Date().getFullYear() - dep.vehicle?.production_year : undefined;

        // Rozšířené informace o vozidle
        const vehicleInfo = {
          manufacturer: dep.vehicle?.manufacturer,
          model_year: dep.vehicle?.production_year,
          capacity: dep.vehicle?.capacity,
          doors: dep.vehicle?.doors,
          length: dep.vehicle?.length
        };

        // Features detection podle skutečné API struktury - stejně jako low_floor
        const usbCharging = dep.vehicle?.has_usb_chargers;
        const boardingWheelchair = dep.trip?.is_wheelchair_accessible;

        // Fallback na starší field names pokud nejsou k dispozici nové
        const features = dep.vehicle?.features || [];
        const wifi = features.includes('wifi') || features.includes('wi-fi');
        const lowFloor = features.includes('low_floor') || features.includes('nizka_podlaha') || dep.trip?.is_low_floor;
        const airConditioning = features.includes('air_conditioning') || features.includes('klimatizace') || dep.trip?.is_air_conditioned;
        const bikeRack = features.includes('bike_rack') || features.includes('kola');

        const currentStop = dep.last_stop?.name;

        // Vehicle position data
        const vehiclePosition = dep.vehicle_position;
        const currentLatitude = vehiclePosition?.latitude;
        const currentLongitude = vehiclePosition?.longitude;
        const lastUpdate = vehiclePosition?.last_position_at;
        const currentSpeed = vehiclePosition?.speed;

        // Zajímavé údaje pro dopravní školu - používáme správné field names
        const stopSequence = dep.stop_sequence;
        const distanceTraveled = dep.shape_dist_traveled;
        const blockId = dep.block_id; // Přímý přístup místo dep.trip?.block_id
        const serviceId = dep.service_id; // Přímý přístup
        const wheelchairAccessible = dep.wheelchair_accessible;
        const bikesAllowed = dep.bikes_allowed;
        const routeLongName = dep.route_long_name; // Přímý field
        const routeColor = dep.route_color;
        const routeTextColor = dep.route_text_color;
        const agencyName = dep.agency_name; // Přímý field
        const agencyUrl = dep.agency_url;
        const stopHeadsign = dep.stop_headsign;
        const pickupType = dep.pickup_type;
        const dropOffType = dep.drop_off_type;

        // Zkontrolujeme, jaké údaje má API skutečně k dispozici
        if (dep.vehicle_number) {
        }

        // Info o dostupnosti rozšířených údajů
        if (dep.vehicle_number && !dep.block_id) {
        }

        let tripId = dep.trip?.id;
        let tripNumber = undefined;

        if (tripId) {
          if (tripId.includes('_')) {
            // GTFS format like "115_107_180501"
            const parts = tripId.split('_');
            if (parts.length >= 3) {
              // Last part contains trip sequence, extract meaningful number
              const lastPart = parts[parts.length - 1];
              // Try to extract trip number from the sequence (e.g., "180501" -> "18")
              if (lastPart.length >= 2) {
                tripNumber = lastPart.substring(0, 2);
              }
            } else if (parts.length >= 2) {
              tripNumber = parts[parts.length - 1];
            }
          } else {
            // Simple numeric trip_id
            tripNumber = tripId;
          }
        }
        
        const routeId = dep.route?.short_name || undefined;
        
        const processed = {
          arrival_timestamp: arrivalTimestamp,
          departure_timestamp: arrivalTimestamp,
          delay: delay,
          route_short_name: dep.route?.short_name || 'N/A',
          route_type: dep.route?.type || 0,
          headsign: dep.trip?.headsign || 'Neznámý směr',
          trip_id: tripId,
          trip_number: tripNumber,
          wheelchair_accessible: dep.trip?.is_wheelchair_accessible || false,
          last_position_age: 0,
          alert_hash: dep.trip?.is_canceled ? 'canceled' : undefined,
          vehicle_number: vehicleNumber,
          vehicle_operator: vehicleOperator,
          vehicle_type: vehicleType,
          vehicle_model: vehicleModel,
          vehicle_age: vehicleAge,
          air_conditioning: airConditioning,
          wifi: wifi,
          low_floor: lowFloor,
          bike_rack: bikeRack,
          usb_charging: usbCharging,
          boarding_wheelchair: boardingWheelchair,
          current_stop: currentStop,
          route_id: routeId,
          platform_code: dep.stop?.platform_code,
          current_latitude: currentLatitude,
          current_longitude: currentLongitude,
          last_position_update: lastUpdate,
          current_speed: currentSpeed,
          stop_sequence: stopSequence,
          distance_traveled: distanceTraveled,
          block_id: blockId,
          service_id: serviceId,
          bikes_allowed: bikesAllowed,
          route_long_name: routeLongName,
          route_color: routeColor,
          route_text_color: routeTextColor,
          agency_name: agencyName,
          agency_url: agencyUrl,
          stop_headsign: stopHeadsign,
          pickup_type: pickupType,
          drop_off_type: dropOffType
        };
        
        return processed;
      })
      .filter((dep: any) => dep !== null)
      .filter((dep: any) => {
        const now = Math.floor(Date.now() / 1000);
        const timeDiff = dep.arrival_timestamp - now;
        
        const maxTime = dep.route_short_name?.startsWith('3') ? 3600 : 1800;
        const isInTimeRange = timeDiff > 0 && timeDiff <= maxTime;
        
        if (!isInTimeRange) {
        }
        
        return isInTimeRange;
      })
      // Seřadíme všechny odjezdy podle času
      .sort((a: any, b: any) => a.arrival_timestamp - b.arrival_timestamp)
      .slice(0, 8);


    // Enrichment odstraněn

    return {
      departures: processedDepartures,
      alerts: allAlerts
    };
  } catch (error: any) {
    return {
      departures: [],
      alerts: []
    };
  }
};
