// Průměrná chodecká rychlost pro chodec na chodníku (Praha, mírná zástavba).
const WALKING_SPEED_M_PER_MIN = 80;

// Přímá vzdálenost vs reálná pěší cesta — Praha má bloky, ulice, schody.
// Faktor 1.3 je rozumný kompromis bez routing API.
const DETOUR_FACTOR = 1.3;

export function haversineMeters(
  lat1: number, lon1: number, lat2: number, lon2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function walkingMinutes(
  userLat: number, userLon: number,
  stopLat: number, stopLon: number,
): number {
  const meters = haversineMeters(userLat, userLon, stopLat, stopLon) * DETOUR_FACTOR;
  return Math.max(0, Math.round(meters / WALKING_SPEED_M_PER_MIN));
}
