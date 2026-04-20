// Firebase Cloud Messaging — uses compat SDK loaded via script tags in index.html

const VAPID_KEY = "BM5sK6iycOKeDUSSdjOYJRhpodZy3KEEdSvDZFLDbPvPVrIChjZAE47u51AGsGE_8R1iBjs36GD55tRlle2ssik";

let messaging: any = null;

function getMessaging() {
  if (messaging) return messaging;
  const fb = (window as any).firebase;
  if (!fb || !fb.messaging) return null;
  messaging = fb.messaging();
  return messaging;
}

export async function registerFirebaseSW(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    if (!reg) {
      reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    }
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.error("Firebase SW error:", e);
    return null;
  }
}

export async function getFCMToken(): Promise<string | null> {
  try {
    if (Notification.permission !== "granted") return null;

    const msg = getMessaging();
    if (!msg) {
      console.error("Firebase messaging not available");
      return null;
    }

    await registerFirebaseSW();
    await new Promise((r) => setTimeout(r, 500));

    const token = await msg.getToken({ vapidKey: VAPID_KEY });
    console.log("FCM token:", token?.substring(0, 20) + "...");
    // Cache for supabase fetch wrapper — used as x-fcm-token header for RLS.
    if (token && typeof localStorage !== "undefined") {
      localStorage.setItem("fcm_token", token);
    }
    return token;
  } catch (e) {
    console.error("FCM token error:", e);
    return null;
  }
}

export function onForegroundMessage(callback: (title: string, body: string) => void) {
  const msg = getMessaging();
  if (!msg) return;
  msg.onMessage((payload: any) => {
    const title = payload.notification?.title || payload.data?.title || "SPSD Timetable";
    const body = payload.notification?.body || payload.data?.body || "";
    callback(title, body);
  });
}
