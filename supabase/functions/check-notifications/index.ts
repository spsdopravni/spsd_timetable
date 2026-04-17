import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64url } from "https://deno.land/std@0.208.0/encoding/base64url.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOLEMIO_API_KEY = Deno.env.get("GOLEMIO_API_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcwNCwiaWF0IjoxNzYwNzkxMjUwLCJleHAiOjExNzYwNzkxMjUwLCJpc3MiOiJnb2xlbWlvIiwianRpIjoiM2Y4MWJiMjItM2YxNC00ODgxLThlMDYtYjQ1YmRlOTYzZjk3In0.BR0653y2bfG0zxdkOYvDgvywRR9Z9nXB4NlatJXR38A";

const FCM_PROJECT_ID = "spsdodjezdovka";
const FCM_CLIENT_EMAIL = "firebase-adminsdk-fbsvc@spsdodjezdovka.iam.gserviceaccount.com";
const FCM_PRIVATE_KEY = Deno.env.get("FCM_PRIVATE_KEY") || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDDhMldXrI1/YHA
5WWfAp1MPhOXNM9lcfw9kcU/aAjHlJZr51arKwLFRRkd7jiwxcTpgj5MH1q02q8b
4xjVjHDHqcvV9aRfK6Bmn7Rs0PV5uF1p/a715dr4QA853KZ7EoK0phxWggKUMZkY
jaOJcTMr9NpiUefnX4A6yRwXAqZl+Shi0C4q952nltiOdGPKOaJF1813NgJlCDeb
lfowN+lirsWt0U0dH32duNixrrdiDvCyrRiMPqcGTiUDjJhbprtALZaZ2wlu0PUs
NlSMojvWqw/i+3wdvV9qs4rCGDhvh3yd/BK7YCpJzMCk2e8uGXPj5yc6+7VIJSHI
lNaBI9fPAgMBAAECggEAMFhMJj89F6aIh/bxCsFtvaV32KKhSbdGpL6/pC8IRLlT
/HhmcMqg08CDNmhqMiOkzgx7dP0nw6JzPBUKVft1A5nToiMsMrAp6FZDGckNebyB
tKyar4jXfRzx5t/Ndo8cLKkKRsW894HQFkcnkdugyJSxzy/rhMWTgnWp8XKhTINB
dwVtZceHDphpLUXxXR2VFDRa3sMMkQMKKB/5aJ+1WfFoAxgRYN1ZkF9J9mC1RR0L
nN1/FEOHhWopjvIgxsSwZrTN02QCCKrWCdoIkh1TAWepSVr/Smh0O+NBEyf9CGuu
agcj/htheMuoDRXIohjdoTD4bEBg+TzAA5MTXkWIWQKBgQDvr4JC4w/PZ/iBIZSh
7pH0NDAckR+6HsVyMhKn+JWvgH0sau8BNd6DdGLo27G1EdFa20ZAEaoY2fKaKyPZ
RdBTXmjGAFOF5UsmH7ENQdfR1AoNU59cubo9VmWx08Bu0pjfvCIeK1G0Ne+89R9Z
nKA6azAYGxeUZmk+qt1zXQDTbQKBgQDQ06zjOIkeEmHzbne8YBZKqHfCivfBlU1q
gpz/5wRIO7j4DgIW72DJahuvk5ii/ltODv3jJV/Pg1QOAtSl/AxqQtd+t7yqf8se
EsqHSS5U/Opc9BzHpPnZjBLgJOAN+oF4SKdCsZbA9JUC6pvs8lYkcaz4c5cET1uY
zJANWtBWqwKBgQDbNlbZm9fi5oF2gOLyc0KT6YMzLVuqGuiUd81uSMGGIOray/ZJ
0h3vdmvb8sqGA4TJJxEKGd3LGtJyRBBmcB6HkSocJUI+jKZ9eLCyokykAN0ssRVo
dgkqfjFGQZeXBA+DWQqPMylnu4jG9h01FTXKGCyFb4nSVRPel+Ev2JifxQKBgAY9
LL8lI0OYvQBu3njsTf4xBlLzn+9SrJtwB4zFtCUMU7xlfr58rGGYH/eg60CDZOry
G7e7mB81Bz/b6cqDu0M5eAK7LpHRe5oMaaydDRtQ6xeX23xDe4t6Wd4EfAUu5MtZ
MFYXxC9Dn2gU5k+v9c7k7owFuA9S56OrCOq9Odg9AoGAOPJrVQE6PsL4ASvtZy+C
yZk+MU5uNcGY94cz577mMMEs9g4bzSdeSofpThAy6y88ejkNBk+TI8d1U6oalCA3
VCKu7OpC5/i9s2ZdVC1uh7qwRWprTqAH//WesLY7ZMpAvPboSERxyz6GyS8ZkLUs
l9093mBzt6RBQaGVVkhncsI=
-----END PRIVATE KEY-----`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ── FCM V1 OAuth2 ─────────────────────────────────────────── */

let cachedAccessToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() / 1000 < tokenExpiry - 60) {
    return cachedAccessToken;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = base64url(new TextEncoder().encode(JSON.stringify({
    iss: FCM_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })));

  const unsigned = `${header}.${payload}`;

  // Import private key and sign
  const pemContent = FCM_PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const keyData = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8", keyData, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(new Uint8Array(signature))}`;

  // Exchange JWT for access token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  cachedAccessToken = data.access_token;
  tokenExpiry = now + (data.expires_in || 3600);
  return data.access_token;
}

async function sendFCM(fcmToken: string, title: string, body: string): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: { title, body },
            webpush: {
              notification: {
                title,
                body,
                icon: "https://timetable.brozovec.eu/pictures/robotz-192.png",
                badge: "https://timetable.brozovec.eu/pictures/robotz-192.png",
                vibrate: [200, 100, 200],
                tag: "spsd-departure",
                renotify: true,
                require_interaction: true,
              },
            },
          },
        }),
      }
    );

    if (res.ok) {
      console.log(`FCM V1 sent OK`);
      return true;
    }
    console.error(`FCM V1 error: ${res.status} ${await res.text()}`);
    return false;
  } catch (e) {
    console.error("FCM error:", e);
    return false;
  }
}

/* ── Main handler ──────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const now = Math.floor(Date.now() / 1000);

    const { data: subs, error } = await supabase
      .from("notification_subscriptions")
      .select("*")
      .eq("notified", false)
      .gt("expires_at", new Date().toISOString())
      .limit(100);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: "No active", count: 0 }), { headers: corsHeaders });
    }

    let notifiedCount = 0;

    // Cache vehicle-positions response per route → 1 fetch per route per run.
    const vpCache = new Map<string, any>();
    async function getVehiclePositions(routeNum: string): Promise<any> {
      if (vpCache.has(routeNum)) return vpCache.get(routeNum);
      try {
        const r = await fetch(
          `https://api.golemio.cz/v2/vehiclepositions?routeShortName=${routeNum}&limit=50`,
          { headers: { "X-Access-Token": GOLEMIO_API_KEY } },
        );
        if (!r.ok) {
          console.warn(`vp fetch ${routeNum} → ${r.status}`);
          vpCache.set(routeNum, null);
          return null;
        }
        const json = await r.json();
        vpCache.set(routeNum, json);
        return json;
      } catch (e) {
        console.error(`vp fetch ${routeNum} threw:`, e);
        vpCache.set(routeNum, null);
        return null;
      }
    }

    // Cache trip stop_times per trip_id (only used for legacy fallback).
    const tripCache = new Map<string, any>();
    async function getTripStopTimes(tripId: string): Promise<any[] | null> {
      if (tripCache.has(tripId)) return tripCache.get(tripId);
      try {
        const r = await fetch(
          `https://api.golemio.cz/v2/gtfs/trips/${encodeURIComponent(tripId)}?includeStopTimes=true&includeStops=true`,
          { headers: { "X-Access-Token": GOLEMIO_API_KEY } },
        );
        if (!r.ok) {
          tripCache.set(tripId, null);
          return null;
        }
        const json = await r.json();
        const list = json.stop_times || [];
        tripCache.set(tripId, list);
        return list;
      } catch (e) {
        console.error(`trip fetch ${tripId} threw:`, e);
        tripCache.set(tripId, null);
        return null;
      }
    }

    console.log(`check-notifications: ${subs.length} active subs`);

    for (const sub of subs) {
      let shouldNotify = false;
      const title = `${sub.route_short_name} \u2192 ${sub.headsign}`;
      let body = "";

      if (sub.notify_type === "minutes" && sub.notify_minutes) {
        const minutesLeft = Math.floor((sub.arrival_timestamp - now) / 60);
        if (minutesLeft <= sub.notify_minutes && minutesLeft >= 0) {
          shouldNotify = true;
          body = `Za ${minutesLeft} min na ${sub.station_name}! Vyraz!`;
        }
      }

      if (sub.notify_type === "stop") {
        try {
          // Use the saved route short name directly — more reliable than
          // parsing the trip_id (which can have route id prefixes, not short names).
          const routeNum = sub.route_short_name || sub.trip_id.split("_")[0];
          const data = await getVehiclePositions(routeNum);
          if (!data) {
            console.log(`sub ${sub.id}: no vp data for route ${routeNum}`);
          } else {
            const features = data.features || [];
            const feature = features.find(
              (f: any) => f.properties?.trip?.gtfs?.trip_id === sub.trip_id,
            );

            if (!feature) {
              console.log(
                `sub ${sub.id}: trip ${sub.trip_id} not found among ${features.length} vehicles on route ${routeNum}`,
              );
            } else {
              const lp = feature.properties.last_position || {};
              const lastStopSeq: number | undefined = lp.last_stop?.sequence;
              const lastStopId: string | undefined = lp.last_stop?.id;
              const lastStopName: string | undefined = lp.last_stop?.name;

              // Resolve target sequence — prefer the value saved with the sub.
              let targetSeq: number | null = sub.notify_stop_sequence ?? null;
              if (targetSeq == null && (sub.notify_stop_id || sub.notify_stop_name)) {
                const stops = await getTripStopTimes(sub.trip_id);
                const found = stops?.find((st: any) =>
                  (sub.notify_stop_id && st.stop_id === sub.notify_stop_id) ||
                  (sub.notify_stop_name && st.stop?.properties?.stop_name === sub.notify_stop_name),
                );
                if (found) targetSeq = found.stop_sequence;
              }

              // Triggers in priority order:
              //   1. vehicle's last_stop.id matches the saved notify stop id (most reliable)
              //   2. lastStopSeq has reached or passed the target sequence
              //   3. vehicle's last_stop.name matches the saved notify name (old subs fallback)
              const directIdMatch =
                !!sub.notify_stop_id && !!lastStopId && lastStopId === sub.notify_stop_id;
              const sequenceMatch =
                targetSeq != null && lastStopSeq != null && lastStopSeq >= targetSeq;
              const nameMatch =
                !!sub.notify_stop_name && !!lastStopName && lastStopName === sub.notify_stop_name;

              console.log(
                `sub ${sub.id}: route=${routeNum} trip=${sub.trip_id} lastSeq=${lastStopSeq} lastId=${lastStopId} lastName=${lastStopName} targetSeq=${targetSeq} targetId=${sub.notify_stop_id} targetName=${sub.notify_stop_name} → id=${directIdMatch} seq=${sequenceMatch} name=${nameMatch}`,
              );

              if (directIdMatch || sequenceMatch || nameMatch) {
                shouldNotify = true;
                body = `Proj\u00ed\u017ed\u00ed ${sub.notify_stop_name || "tvou zast\u00e1vku"}! Bl\u00ed\u017e\u00ed se na ${sub.station_name}!`;
              }
            }
          }
        } catch (e) {
          console.error("Vehicle check error:", e);
        }
      }

      if (shouldNotify) {
        if (!sub.push_endpoint || sub.push_endpoint.startsWith("local-")) {
          console.warn(`sub ${sub.id}: shouldNotify but endpoint is "${sub.push_endpoint}" → skipping FCM, marking notified`);
          // Mark notified so we stop re-evaluating this dead sub each poll.
          await supabase.from("notification_subscriptions").update({ notified: true }).eq("id", sub.id);
        } else {
          const sent = await sendFCM(sub.push_endpoint, title, body);
          if (sent) {
            await supabase.from("notification_subscriptions").update({ notified: true }).eq("id", sub.id);
            notifiedCount++;
          } else {
            console.warn(`sub ${sub.id}: FCM send failed`);
          }
        }
      }
    }

    // Cleanup expired
    await supabase.from("notification_subscriptions").delete().lt("expires_at", new Date().toISOString());

    return new Response(
      JSON.stringify({ checked: subs.length, notified: notifiedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
