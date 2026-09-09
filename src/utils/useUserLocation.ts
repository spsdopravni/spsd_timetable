import { useEffect, useState } from "react";

export interface UserLocation {
  lat: number;
  lon: number;
  accuracy: number;
}

export interface UseUserLocationResult {
  location: UserLocation | null;
  error: string | null;
  status: "idle" | "requesting" | "granted" | "denied" | "unavailable";
}

/**
 * Continuously tracks the user's geolocation. Requires HTTPS in production.
 * Permission is requested on first call; subsequent calls reuse the active watch.
 */
export function useUserLocation(enabled: boolean = true): UseUserLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<UseUserLocationResult["status"]>("idle");

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      setError("Geolokace v tomto prohlížeči nefunguje");
      return;
    }

    setStatus("requesting");
    const opts: PositionOptions = {
      enableHighAccuracy: false,
      maximumAge: 30_000,
      timeout: 15_000,
    };

    const handlePos = (pos: GeolocationPosition) => {
      setLocation({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      setStatus("granted");
      setError(null);
    };
    const handleErr = (err: GeolocationPositionError) => {
      setError(err.message);
      if (err.code === err.PERMISSION_DENIED) setStatus("denied");
    };

    navigator.geolocation.getCurrentPosition(handlePos, handleErr, opts);
    const watchId = navigator.geolocation.watchPosition(handlePos, handleErr, opts);
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { location, error, status };
}
