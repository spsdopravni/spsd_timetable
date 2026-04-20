import type { Station, Departure } from "@/types/pid";
import { getMockDepartures } from "./mockData";
import { apiCache, cached } from "./apiCache";

const API_BASE = "https://api.golemio.cz";

// Environment detection
const isDevelopment = import.meta.env.MODE === 'development';
// Umožni manuální override přes environment variable
const forceMockData = import.meta.env.VITE_USE_MOCK_DATA;
const USE_MOCK_DATA = forceMockData !== undefined
  ? forceMockData === 'true'
  : isDevelopment; // Defaultně dev = mock, prod = API

console.log('🔧 Environment:', import.meta.env.MODE);
console.log('📊 Using mock data:', USE_MOCK_DATA);
if (forceMockData !== undefined) {
  console.log('⚙️ Mock data forced via VITE_USE_MOCK_DATA:', forceMockData);
}

// API klíče pro různé endpointy
const API_KEY_1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcwNCwiaWF0IjoxNzYwNzkxMjUwLCJleHAiOjExNzYwNzkxMjUwLCJpc3MiOiJnb2xlbWlvIiwianRpIjoiM2Y4MWJiMjItM2YxNC00ODgxLThlMDYtYjQ1YmRlOTYzZjk3In0.BR0653y2bfG0zxdkOYvDgvywRR9Z9nXB4NlatJXR38A";
const API_KEY_2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcwNywiaWF0IjoxNzYwNzkxMjc4LCJleHAiOjExNzYwNzkxMjc4LCJpc3MiOiJnb2xlbWlvIiwianRpIjoiN2U2ZTViOWMtYjkyOS00NzZlLTk0MmItYTY4NzdkM2M2MjNjIn0._K4k4Mrfy1_cWiy3Za_DRrCOX4gfbrz8p0rVZypVFq8";
let API_KEY_3 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDA0NiwiaWF0IjoxNzYwNzk0NjU3LCJleHAiOjExNzYwNzk0NjU3LCJpc3MiOiJnb2xlbWlvIiwianRpIjoiNzAwZmNkOGYtMzYyOS00MjZjLThmYTgtNTU2YTJlZmE1YmFlIn0.r6hVewQXnk8TaowFb7s7lDveyA6XYYGnxe_qlzUbhZM"; // Třetí API klíč pro rozšířené údaje
const API_KEY_PRAGENSIS = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDI0MiwiaWF0IjoxNzY0MjQxNTA2LCJleHAiOjExNzY0MjQxNTA2LCJpc3MiOiJnb2xlbWlvIiwianRpIjoiNzJkZDIzMjktODZmNy00ZTQ5LTljMWUtZDBmMjMzMjY4MTE4In0.sqKPVMufNSNTPYXVyE4gBKcHLUoUdgutbXdbD3vkSNU"; // API klíč pro Pragensis

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

  // Vyšehrad metro C - API klíč Pragensis
  "U527Z101P": API_KEY_PRAGENSIS,
  "U527Z102P": API_KEY_PRAGENSIS,

  // Vyšehrad bus (noční) - API klíč Pragensis
  "U527Z1P": API_KEY_PRAGENSIS,
  "U527Z2P": API_KEY_PRAGENSIS,

  // Svatoplukova tram - API klíč Pragensis
  "U724Z1P": API_KEY_PRAGENSIS,
  "U724Z2P": API_KEY_PRAGENSIS,

  // Jana Masaryka - API klíč 3
  "U354Z1P": API_KEY_3,
  "U354Z2P": API_KEY_3,

  // Šumavská - API klíč 3
  "U744Z1P": API_KEY_3,
  "U744Z2P": API_KEY_3,

  // Náměstí Míru metro A - API klíč Pragensis
  "U476Z101P": API_KEY_PRAGENSIS,
  "U476Z102P": API_KEY_PRAGENSIS,

  // Výstaviště - API klíč Pragensis
  "U532Z1P": API_KEY_PRAGENSIS,
  "U532Z2P": API_KEY_PRAGENSIS,
  "U532Z3P": API_KEY_PRAGENSIS,
  "U532Z301": API_KEY_PRAGENSIS,

  // Metro C — Vltavská + Nádraží Holešovice
  "U100Z101P": API_KEY_PRAGENSIS,
  "U100Z102P": API_KEY_PRAGENSIS,
  "U115Z101P": API_KEY_PRAGENSIS,
  "U115Z102P": API_KEY_PRAGENSIS,

  // Praha-Bubny
  "U100Z301": API_KEY_PRAGENSIS,
};

// Funkce pro nastavení třetího API klíče
export const setThirdApiKey = (key: string) => {
  API_KEY_3 = key;
};

const getApiKeyForStation = (stationId: string): string => {
  const key = STATION_API_MAPPING[stationId] || API_KEY_1;
  if (!key || key.trim() === '') {
    return 'MISSING_API_KEY';
  }
  return key;
};

const getHeadersForStation = (stationId: string) => ({
  "X-Access-Token": getApiKeyForStation(stationId),
  "Content-Type": "application/json"
});

// Headers pro extended data odstraněny

// Vehicle enrichment funkce odstraněna

/* ── Trip stop times ────────────────────────────────────────── */

export interface TripStop {
  stopId: string;
  stopName: string;
  arrivalTime: string;  // "HH:mm:ss"
  departureTime: string;
  stopSequence: number;
  lat: number;
  lon: number;
}

// Cache souřadnic zastávek per stop_id. Coords zastávek se prakticky nemění,
// takže persistujeme do localStorage — uchová se mezi page refreshy a snižuje
// počet volání Golemio API (důležité kvůli rate limitu).
const COORDS_LS_PREFIX = "stop_coords_";
const stopCoordsCache = new Map<string, { lat: number; lon: number } | null>();

export const getStopCoords = async (
  stopId: string,
): Promise<{ lat: number; lon: number } | null> => {
  if (!stopId) return null;
  if (stopCoordsCache.has(stopId)) return stopCoordsCache.get(stopId)!;

  // Try localStorage first.
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(COORDS_LS_PREFIX + stopId);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.lat === "number" && typeof parsed.lon === "number") {
          stopCoordsCache.set(stopId, parsed);
          return parsed;
        }
      }
    }
  } catch {}

  try {
    const r = await fetch(
      `${API_BASE}/v2/gtfs/stops/${encodeURIComponent(stopId)}`,
      { headers: { "X-Access-Token": API_KEY_1 } },
    );
    if (!r.ok) {
      stopCoordsCache.set(stopId, null);
      return null;
    }
    const d = await r.json();
    const coords = d.geometry?.coordinates; // GeoJSON [lon, lat]
    if (!coords || coords.length < 2) {
      stopCoordsCache.set(stopId, null);
      return null;
    }
    const result = { lon: coords[0], lat: coords[1] };
    stopCoordsCache.set(stopId, result);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(COORDS_LS_PREFIX + stopId, JSON.stringify(result));
      }
    } catch {}
    return result;
  } catch {
    stopCoordsCache.set(stopId, null);
    return null;
  }
};

// Najde trip_id pokračující linky, který odjíždí z dané zastávky nejdřív po `afterUnix`.
// Použije departureboards (široké okno) a vybere první match.
export const findNextTripId = async (
  stopId: string,
  routeShort: string,
  afterUnix: number,
): Promise<string | null> => {
  if (!stopId || !routeShort) return null;
  try {
    const url = `${API_BASE}/v2/pid/departureboards?ids=${encodeURIComponent(stopId)}&limit=30&minutesAfter=30`;
    const res = await fetch(url, {
      headers: { "X-Access-Token": API_KEY_1, "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const candidates = (data.departures || [])
      .filter((d: any) => d.route?.short_name === routeShort)
      .map((d: any) => {
        const sched = d.departure_timestamp?.scheduled || d.departure_timestamp?.predicted;
        return {
          tripId: d.trip?.id as string | undefined,
          ts: sched ? Math.floor(new Date(sched).getTime() / 1000) : null,
        };
      })
      .filter((x: any) => x.tripId && x.ts !== null)
      // Tolerujeme až 60s před afterUnix (stejný vůz, který právě dojel)
      .filter((x: any) => x.ts >= afterUnix - 60)
      .sort((a: any, b: any) => a.ts - b.ts);

    return candidates[0]?.tripId || null;
  } catch {
    return null;
  }
};

export const getTripStops = async (tripId: string): Promise<TripStop[]> => {
  if (USE_MOCK_DATA || !tripId) return [];

  // v2 cache key — bumped after adding pickup_type/drop_off_type filter for technical points.
  const cacheKey = `trip_stops_v2_${tripId}`;
  const cachedData = apiCache.get<TripStop[]>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const response = await fetch(
      `${API_BASE}/v2/gtfs/trips/${encodeURIComponent(tripId)}?includeStopTimes=true&includeStops=true`,
      { headers: { "X-Access-Token": API_KEY_1, "Content-Type": "application/json" } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const stopTimes = data.stop_times || [];

    const stops: TripStop[] = stopTimes
      // Filtruj technické body (výhybky, km značky, hranice úseků) — pasažér tam
      // nenastupuje ani nevystupuje. Pickup/drop-off type 1 = "no service".
      // Golemio vrací tahle pole jako string ("0"/"1"), ne number — porovnávám obojí.
      .filter((st: any) => {
        const pu = Number(st.pickup_type);
        const doff = Number(st.drop_off_type);
        return !(pu === 1 && doff === 1);
      })
      .map((st: any) => ({
        stopId: st.stop_id,
        stopName: st.stop?.properties?.stop_name || st.stop_id,
        arrivalTime: st.arrival_time,
        departureTime: st.departure_time,
        stopSequence: st.stop_sequence,
        lat: st.stop?.geometry?.coordinates?.[1] || 0,
        lon: st.stop?.geometry?.coordinates?.[0] || 0,
      }));

    apiCache.set(cacheKey, stops, 'routes');
    return stops;
  } catch {
    return [];
  }
};

export const searchStations = async (query: string): Promise<Station[]> => {
  const cacheKey = `stations_${query.toLowerCase()}`;

  // Zkus získat z cache
  const cached = apiCache.get<Station[]>(cacheKey);
  if (cached) {
    return cached;
  }

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
    const stations = data.stops || [];

    // Ulož do cache
    apiCache.set(cacheKey, stations, 'stations');

    return stations;
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

export const getDepartures = async (stationIds: string | string[]): Promise<{ departures: Departure[]; alerts: any[] }> => {
  // Cache key pro departures
  const ids = Array.isArray(stationIds) ? stationIds : [stationIds];
  const cacheKey = `departures_${ids.sort().join('_')}`;

  // Zkus získat z cache
  const cached = apiCache.get<{ departures: Departure[]; alerts: any[] }>(cacheKey);
  if (cached) {
    return cached;
  }

  // 🔧 DEV MODE: Použij mock data místo API
  if (USE_MOCK_DATA) {
    console.log('🎭 DEV MODE: Returning mock data instead of calling API');
    // Simuluj malé zpoždění jako u API
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockData = { departures: getMockDepartures(), alerts: [] };
    apiCache.set(cacheKey, mockData, 'departures');
    return mockData;
  }

  // 🌐 PROD MODE: Volej skutečné API
  try {
    const ids = Array.isArray(stationIds) ? stationIds : [stationIds];

    let allDepartures: any[] = [];
    let allAlerts: any[] = [];

    // Použij API klíč podle první stanice v seznamu
    const apiKey = getApiKeyForStation(ids[0]);
    const extendedHeaders = {
      "X-Access-Token": apiKey,
      "Content-Type": "application/json"
    };

    // API podporuje více IDs jako separate params: ?ids=ID1&ids=ID2
    const idsParams = ids.map(id => `ids=${id}`).join('&');
    const url = `${API_BASE}/v2/pid/departureboards/?${idsParams}&limit=20&minutesBefore=0&minutesAfter=30`;

    const response = await fetch(url, { headers: extendedHeaders });

    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }

    if (response.status === 401) {
      throw new Error('Unauthorized');
    }

    if (response.ok) {
      const data = await response.json();

      if (data.departures && Array.isArray(data.departures) && data.departures.length > 0) {
        allDepartures = [...allDepartures, ...data.departures];
      }

      // Shromažďujeme alerts/infotexts
      if (data.infotexts && Array.isArray(data.infotexts) && data.infotexts.length > 0) {
        allAlerts = [...allAlerts, ...data.infotexts];
      }
    }
    
    
    if (allDepartures.length === 0) {
      return {
        departures: [],
        alerts: allAlerts
      };
    }
    
    // Vyparsuj continuation rules z infotexts:
    //   "Linka X pokračuje z STOP_NAME jako (nová )?linka Y[ směr DIR]..."
    // Klíč mapy: `${routeShortName}__${stopName}` (case-insensitive)
    type Cont = { as: string; from: string; direction?: string };
    const continuations = new Map<string, Cont>();
    const contRegex = /Linka\s+(\S+)\s+pokra[čc]uje\s+z\s+(.+?)\s+jako\s+(?:nov[aá]\s+)?linka\s+(\S+?)(?:\s+sm[ěe]r\s+(.+?))?[\.\s]/i;
    for (const info of allAlerts) {
      const text = info?.text || "";
      const m = text.match(contRegex);
      if (m) {
        const fromRoute = m[1].trim();
        const fromStop = m[2].trim();
        const asRoute = m[3].trim();
        const direction = m[4]?.trim();
        continuations.set(`${fromRoute}__${fromStop.toLowerCase()}`, {
          as: asRoute,
          from: fromStop,
          direction,
        });
      }
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
          is_night: dep.route?.is_night || false,
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
          drop_off_type: dropOffType,
          last_stop_name: dep.last_stop?.name || undefined,
        } as any;

        // Match continuation rule: `Linka X pokračuje z TERMINUS jako Y`.
        // The trip's terminus is `trip.headsign` (NOT `last_stop.name`, which is
        // the last passed stop along the way). Matching is fuzzy — covers cases
        // where the infotext from-stop and the headsign aren't formatted identically.
        const headsign = (dep.trip?.headsign || "").toLowerCase().trim();
        if (headsign) {
          for (const [key, cont] of continuations) {
            const [keyRoute, keyStop] = key.split("__");
            if (keyRoute !== processed.route_short_name) continue;
            if (keyStop === headsign || keyStop.includes(headsign) || headsign.includes(keyStop)) {
              processed.continues_as = cont.as;
              processed.continues_from = cont.from;
              processed.continues_direction = cont.direction;
              break;
            }
          }
        }

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

    const result = {
      departures: processedDepartures,
      alerts: allAlerts
    };

    // Ulož do cache
    apiCache.set(cacheKey, result, 'departures');

    return result;
  } catch (error: any) {
    // V případě chyby zkus vrátit stará data z cache
    const staleData = apiCache.get<{ departures: Departure[]; alerts: any[] }>(cacheKey);
    if (staleData) {
      console.warn('Using stale cache data due to API error');
      return staleData;
    }

    throw error;
  }
};
