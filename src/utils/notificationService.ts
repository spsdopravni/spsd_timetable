import { getFCMToken, registerFirebaseSW } from "./firebase";
import { supabase } from "./supabase";

/* ── FCM Token management ──────────────────────────────────── */

let cachedToken: string | null = null;

// Call this early to pre-register SW + start checking for notifications
export async function initNotifications() {
  await registerFirebaseSW();
  startNotificationChecker();
}

// Poll Edge Function every 30s to check & send notifications
let checkerInterval: ReturnType<typeof setInterval> | null = null;

function startNotificationChecker() {
  if (checkerInterval) return;

  const check = async () => {
    try {
      await supabase.functions.invoke("check-notifications");
    } catch {}
  };

  // First check after 5s, then every 30s
  setTimeout(check, 5000);
  checkerInterval = setInterval(check, 30000);
}

// Call AFTER Notification.requestPermission() === "granted"
export async function requestPushPermission(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  const token = await getFCMToken();
  if (token) cachedToken = token;
  return token;
}

export function getCachedToken(): string | null {
  return cachedToken;
}

/* ── Save notification to Supabase ─────────────────────────── */

interface NotifyRequest {
  tripId: string;
  routeShortName: string;
  headsign: string;
  stationName: string;
  arrivalTimestamp: number;
  type: "stop" | "minutes";
  stopName?: string;
  minutes?: number;
}

export async function saveNotification(req: NotifyRequest): Promise<boolean> {
  const token = cachedToken || (await getFCMToken());
  const expiresAt = new Date((req.arrivalTimestamp + 3600) * 1000).toISOString();

  const { error } = await supabase.from("notification_subscriptions").insert({
    push_endpoint: token || `local-${Date.now()}`,
    push_p256dh: "",
    push_auth: "",
    trip_id: req.tripId,
    route_short_name: req.routeShortName,
    headsign: req.headsign,
    station_name: req.stationName,
    notify_type: req.type,
    notify_stop_name: req.stopName || null,
    notify_minutes: req.minutes || null,
    arrival_timestamp: req.arrivalTimestamp,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("Failed to save notification:", error);
    return false;
  }
  return true;
}

export async function cancelNotification(tripId: string): Promise<void> {
  await supabase
    .from("notification_subscriptions")
    .delete()
    .eq("trip_id", tripId);
}

export interface ActiveNotification {
  id: string;
  tripId: string;
  notifyType: "stop" | "minutes";
  notifyStopName: string | null;
  notifyMinutes: number | null;
}

export async function getActiveNotifications(tripId: string): Promise<ActiveNotification[]> {
  const { data, error } = await supabase
    .from("notification_subscriptions")
    .select("id, trip_id, notify_type, notify_stop_name, notify_minutes")
    .eq("trip_id", tripId)
    .eq("notified", false);

  if (error || !data) return [];

  return data.map((d: any) => ({
    id: d.id,
    tripId: d.trip_id,
    notifyType: d.notify_type,
    notifyStopName: d.notify_stop_name,
    notifyMinutes: d.notify_minutes,
  }));
}
