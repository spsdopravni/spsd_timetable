import type { Station, Departure } from "@/types/pid";

const API_BASE = "https://api.golemio.cz";

// Dva API klíče pro rozdělení zátěže
const API_KEY_1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcwNCwiaWF0IjoxNzYwNzkxMjUwLCJleHAiOjExNzYwNzkxMjUwLCJpc3MiOiJnb2xlbWlvIiwianRpIjoiM2Y4MWJiMjItM2YxNC00ODgxLThlMDYtYjQ1YmRlOTYzZjk3In0.BR0653y2bfG0zxdkOYvDgvywRR9Z9nXB4NlatJXR38A";
const API_KEY_2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcwNywiaWF0IjoxNzYwNzkxMjc4LCJleHAiOjExNzYwNzkxMjc4LCJpc3MiOiJnb2xlbWlvIiwianRpIjoiN2U2ZTViOWMtYjkyOS00NzZlLTk0MmItYTY4NzdkM2M2MjNjIn0._K4k4Mrfy1_cWiy3Za_DRrCOX4gfbrz8p0rVZypVFq8";

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

const getApiKeyForStation = (stationId: string): string => {
  const key = STATION_API_MAPPING[stationId] || API_KEY_1;
  // Pokud je klíč prázdný, vraťme placeholder - API nebude fungovat
  if (!key || key.trim() === '') {
    console.warn('⚠️ API klíč není nastaven! Prosím nastavte API_KEY_1 a API_KEY_2 v pidApi.ts');
    return 'MISSING_API_KEY';
  }
  return key;
};

const getHeadersForStation = (stationId: string) => ({
  "X-Access-Token": getApiKeyForStation(stationId),
  "Content-Type": "application/json"
});

export const searchStations = async (query: string): Promise<Station[]> => {
  try {
    console.log("Searching for stations:", query);
    const headers = {
      "X-Access-Token": API_KEY_1,
      "Content-Type": "application/json"
    };
    
    const response = await fetch(
      `${API_BASE}/pid/gtfs/stops?names=${encodeURIComponent(query)}&limit=20`,
      { headers }
    );
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    console.log("Stations found:", data);
    
    return data.stops || [];
  } catch (error) {
    console.error("Error searching stations:", error);
    return [];
  }
};

export const getRouteStops = async (routeId: string): Promise<string[]> => {
  console.log("getRouteStops called but disabled to prevent 404 spam");
  return [];
};

export const getStationRoutes = async (stationId: string): Promise<any[]> => {
  try {
    console.log("Fetching routes for station:", stationId);
    const headers = getHeadersForStation(stationId);
    
    const response = await fetch(
      `${API_BASE}/v2/pid/gtfs/stops/${stationId}/routes`,
      { headers }
    );
    
    if (!response.ok) {
      console.log("Station routes API failed");
      return [];
    }
    
    const data = await response.json();
    console.log("Station routes data:", data);
    
    if (data.routes && Array.isArray(data.routes)) {
      return data.routes;
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching station routes:", error);
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
    console.error(`Error fetching transfers for ${stationName}:`, error);
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
    console.log("Getting transfers for route_id:", routeId);
    
    if (!routeId) {
      console.log("No route_id provided, returning empty transfers");
      return {};
    }
    
    const routeKey = routeId.includes('_') ? routeId : `${routeId}_0`;
    if (ROUTE_TRANSFERS[routeKey]) {
      console.log("Found static transfers for route:", routeKey, ROUTE_TRANSFERS[routeKey]);
      return ROUTE_TRANSFERS[routeKey];
    }
    
    const baseRoute = routeId.split('_')[0];
    const baseRouteKey = `${baseRoute}_0`;
    if (ROUTE_TRANSFERS[baseRouteKey]) {
      console.log("Found static transfers for base route:", baseRouteKey, ROUTE_TRANSFERS[baseRouteKey]);
      return ROUTE_TRANSFERS[baseRouteKey];
    }
    
    console.log("No static transfers found, returning empty");
    return {};
  } catch (error) {
    console.error("Error fetching route transfers:", error);
    return {};
  }
};

export const getDepartures = async (stationIds: string | string[]): Promise<Departure[]> => {
  try {
    const ids = Array.isArray(stationIds) ? stationIds : [stationIds];
    
    console.log("🚀 Fetching departures for stations:", ids);
    console.log("🔑 Using API keys based on station mapping");
    
    let allDepartures: any[] = [];
    let workingStations: string[] = [];
    
    // Zkusíme načíst odjezdy postupně pro každé ID s příslušným API klíčem
    for (const stationId of ids) {
      try {
        const headers = getHeadersForStation(stationId);
        const apiKey = getApiKeyForStation(stationId);
        console.log(`🔑 Using API key ${apiKey === API_KEY_1 ? '1' : '2'} for station ${stationId}`);
        
        const url = `${API_BASE}/v2/pid/departureboards/?ids=${stationId}&limit=20&minutesBefore=0&minutesAfter=30`;
        console.log(`🔄 Trying API URL for station ${stationId}:`, url);
        
        const response = await fetch(url, { headers });
        
        if (response.status === 429) {
          console.log(`⚠️ Rate limit hit for station ${stationId} with API key ${apiKey === API_KEY_1 ? '1' : '2'}`);
          continue; // Pokračujeme s dalšími stanicemi
        }

        if (response.status === 401) {
          console.log(`🔑 Unauthorized for station ${stationId} - API key is missing or invalid`);
          continue; // Pokračujeme s dalšími stanicemi
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ API response for station ${stationId}:`, data);
          
          if (data.departures && Array.isArray(data.departures) && data.departures.length > 0) {
            allDepartures = [...allDepartures, ...data.departures];
            workingStations.push(stationId);
            console.log(`📊 Found ${data.departures.length} departures for station ${stationId}`);
          } else {
            console.log(`⚠️ No departures found for station ${stationId}, but API responded OK`);
          }
        } else {
          console.log(`❌ Station ${stationId} returned ${response.status} - ${response.statusText}`);
        }
      } catch (stationError: any) {
        console.log(`💥 Error fetching station ${stationId}:`, stationError);
        continue;
      }
    }
    
    console.log(`🎯 Successfully fetched from stations: ${workingStations.join(', ')}`);
    console.log(`📈 Total raw departures from all working stations: ${allDepartures.length}`);
    
    if (allDepartures.length === 0) {
      console.log("🚫 No departures found from any station");
      return [];
    }
    
    const processedDepartures = allDepartures
      .filter((dep: any) => {
        console.log("🔍 Checking route type:", dep.route?.type, "for route:", dep.route?.short_name);
        const isValidRoute = dep.route?.type !== undefined;
        if (!isValidRoute) {
          console.log("❌ Filtered out departure - no route type:", dep);
        }
        return isValidRoute;
      })
      .map((dep: any) => {
        console.log("⚙️ Processing departure:", dep);
        
        let arrivalTimestamp: number;
        if (dep.arrival_timestamp?.predicted) {
          arrivalTimestamp = Math.floor(new Date(dep.arrival_timestamp.predicted).getTime() / 1000);
        } else if (dep.arrival_timestamp?.scheduled) {
          arrivalTimestamp = Math.floor(new Date(dep.arrival_timestamp.scheduled).getTime() / 1000);
        } else {
          console.log("⏰ No valid timestamp found for departure:", dep);
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

        // Features detection podle API dokumentace
        const airConditioning = dep.vehicle?.is_air_conditioned;
        const usbCharging = dep.vehicle?.has_usb_chargers;
        const boardingWheelchair = dep.vehicle?.is_wheelchair_accessible;

        // Fallback na starší field names pokud nejsou k dispozici nové
        const features = dep.vehicle?.features || [];
        const wifi = features.includes('wifi') || features.includes('wi-fi');
        const lowFloor = features.includes('low_floor') || features.includes('nizka_podlaha') || dep.trip?.is_low_floor;
        const bikeRack = features.includes('bike_rack') || features.includes('kola');

        const currentStop = dep.last_stop?.name;

        // Vehicle position data
        const vehiclePosition = dep.vehicle_position;
        const currentLatitude = vehiclePosition?.latitude;
        const currentLongitude = vehiclePosition?.longitude;
        const lastUpdate = vehiclePosition?.last_position_at;
        const currentSpeed = vehiclePosition?.speed;

        // Zajímavé údaje pro dopravní školu
        const stopSequence = dep.stop_sequence; // Pořadí zastávky na trase
        const distanceTraveled = dep.shape_dist_traveled; // Ujetá vzdálenost na trase
        const blockId = dep.trip?.block_id; // ID bloku - skupina jízd stejného vozidla
        const serviceId = dep.trip?.service_id; // ID služby - provozní den
        const wheelchairAccessible = dep.trip?.wheelchair_accessible; // Bezbariérovost spoje
        const bikesAllowed = dep.trip?.bikes_allowed; // Povolení kol
        const routeLongName = dep.route?.long_name; // Dlouhý název linky
        const routeColor = dep.route?.color; // Barva linky
        const routeTextColor = dep.route?.text_color; // Barva textu linky
        const agencyName = dep.route?.agency?.name; // Název dopravce
        const agencyUrl = dep.route?.agency?.url; // Web dopravce
        const stopHeadsign = dep.stop_headsign; // Směrová tabule pro tuto zastávku
        const pickupType = dep.pickup_type; // Typ nástupu (0=pravidelný, 1=žádný, 2=na znamení, 3=koordinovat s řidičem)
        const dropOffType = dep.drop_off_type; // Typ výstupu

        // Log all available data for debugging
        if (dep.vehicle) {
          console.log(`🚌 Full vehicle data for ${vehicleNumber}:`, dep.vehicle);
        }
        if (dep.vehicle_position) {
          console.log(`📍 Vehicle position data:`, dep.vehicle_position);
        }
        if (dep.trip) {
          console.log(`🚇 Trip data:`, dep.trip);
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
        console.log("🚌 Using route_id:", routeId, "for route:", dep.route?.short_name);
        
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
        
        console.log("✨ Processed departure:", processed);
        return processed;
      })
      .filter((dep: any) => dep !== null)
      .filter((dep: any) => {
        const now = Math.floor(Date.now() / 1000);
        const timeDiff = dep.arrival_timestamp - now;
        console.log(`⏳ Time difference for route ${dep.route_short_name}: ${timeDiff} seconds`);
        
        const maxTime = dep.route_short_name?.startsWith('3') ? 3600 : 1800;
        const isInTimeRange = timeDiff > 0 && timeDiff <= maxTime;
        
        if (!isInTimeRange) {
          console.log(`🚫 Filtered out ${dep.route_short_name} - outside time range (${timeDiff}s)`);
        }
        
        return isInTimeRange;
      })
      // Seřadíme všechny odjezdy podle času
      .sort((a: any, b: any) => a.arrival_timestamp - b.arrival_timestamp)
      .slice(0, 8);
    
    console.log("🏁 Final processed departures (sorted by time):", processedDepartures);
    return processedDepartures;
  } catch (error: any) {
    console.error("💥 Error fetching departures:", error);
    console.log("🔄 Returning empty array due to error");
    return [];
  }
};
