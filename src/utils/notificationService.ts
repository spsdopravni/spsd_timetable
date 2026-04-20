import { getFCMToken, registerFirebaseSW } from "./firebase";
import { supabase } from "./supabase";

/* ── FCM Token management ──────────────────────────────────── */

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
      const { data, error } = await supabase.functions.invoke("check-notifications");
      if (error) console.warn("check-notifications invoke error:", error);
      else if (data) console.debug("check-notifications ok:", data);
    } catch (e) {
      console.warn("check-notifications threw:", e);
    }
  };

  setTimeout(check, 5000);
  checkerInterval = setInterval(check, 30000);
}

// Always get fresh token
export async function requestPushPermission(): Promise<string | null> {
  return await getFCMToken();
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
  stopId?: string;
  stopSequence?: number;
  minutes?: number;
}

export interface SaveResult {
  ok: boolean;
  reason?: "no_token" | "db_error";
}

export async function saveNotification(req: NotifyRequest): Promise<SaveResult> {
  const token = await getFCMToken();
  if (!token) {
    console.warn("saveNotification: no FCM token — push notification won't fire. Permission:", Notification?.permission);
    return { ok: false, reason: "no_token" };
  }

  const expiresAt = new Date((req.arrivalTimestamp + 3600) * 1000).toISOString();

  // Dedupe: delete any existing active sub for same (token, trip, type) before inserting.
  // Bez tohohle by tap-tap-tap nebo otevření trackeru tváří v tvář staré subscription
  // vytvořilo víc duplicitních řádků a server by pak poslal víc notifikací.
  await supabase
    .from("notification_subscriptions")
    .delete()
    .eq("push_endpoint", token)
    .eq("trip_id", req.tripId)
    .eq("notify_type", req.type)
    .eq("notified", false);

  const { error } = await supabase.from("notification_subscriptions").insert({
    push_endpoint: token,
    push_p256dh: "",
    push_auth: "",
    trip_id: req.tripId,
    route_short_name: req.routeShortName,
    headsign: req.headsign,
    station_name: req.stationName,
    notify_type: req.type,
    notify_stop_name: req.stopName || null,
    notify_stop_id: req.stopId || null,
    notify_stop_sequence: req.stopSequence ?? null,
    notify_minutes: req.minutes || null,
    arrival_timestamp: req.arrivalTimestamp,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("Failed to save notification:", error);
    return { ok: false, reason: "db_error" };
  }
  return { ok: true };
}

export async function cancelNotification(tripId: string): Promise<void> {
  // Only delete this device's own subscription for the trip.
  const token = await getFCMToken();
  if (!token) return;
  await supabase
    .from("notification_subscriptions")
    .delete()
    .eq("trip_id", tripId)
    .eq("push_endpoint", token);
}

export interface ActiveNotification {
  id: string;
  tripId: string;
  notifyType: "stop" | "minutes";
  notifyStopName: string | null;
  notifyStopId: string | null;
  notifyMinutes: number | null;
}

export async function getActiveNotifications(tripId: string): Promise<ActiveNotification[]> {
  // Scope to current device: each phone is identified by its FCM token,
  // so users only see their own subscriptions.
  const token = await getFCMToken();
  if (!token) return [];

  const { data, error } = await supabase
    .from("notification_subscriptions")
    .select("id, trip_id, notify_type, notify_stop_name, notify_stop_id, notify_minutes")
    .eq("trip_id", tripId)
    .eq("push_endpoint", token)
    .eq("notified", false);

  if (error || !data) return [];

  return data.map((d: any) => ({
    id: d.id,
    tripId: d.trip_id,
    notifyType: d.notify_type,
    notifyStopName: d.notify_stop_name,
    notifyStopId: d.notify_stop_id,
    notifyMinutes: d.notify_minutes,
  }));
}

export async function cancelNotificationById(id: string): Promise<void> {
  const token = await getFCMToken();
  if (!token) return;
  await supabase
    .from("notification_subscriptions")
    .delete()
    .eq("id", id)
    .eq("push_endpoint", token);
}

// Returns the set of trip_ids that the current device has active notifications for.
// One round-trip instead of N.
export async function getActiveTripIds(): Promise<Set<string>> {
  const token = await getFCMToken();
  if (!token) return new Set();

  const { data, error } = await supabase
    .from("notification_subscriptions")
    .select("trip_id")
    .eq("push_endpoint", token)
    .eq("notified", false);

  if (error || !data) return new Set();
  return new Set(data.map((d: any) => d.trip_id).filter(Boolean));
}
