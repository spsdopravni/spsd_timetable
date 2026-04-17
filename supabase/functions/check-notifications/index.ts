// Supabase Edge Function — kontroluje notifikace a posílá přes FCM
// Deploy: cd ~/Documents/GitHub/spsd_timetable && npx supabase functions deploy check-notifications

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY")!;
const GOLEMIO_API_KEY = Deno.env.get("GOLEMIO_API_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcwNCwiaWF0IjoxNzYwNzkxMjUwLCJleHAiOjExNzYwNzkxMjUwLCJpc3MiOiJnb2xlbWlvIiwianRpIjoiM2Y4MWJiMjItM2YxNC00ODgxLThlMDYtYjQ1YmRlOTYzZjk3In0.BR0653y2bfG0zxdkOYvDgvywRR9Z9nXB4NlatJXR38A";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/* ── Send via FCM ──────────────────────────────────────────── */

async function sendFCM(fcmToken: string, title: string, body: string): Promise<boolean> {
  try {
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: { title, body, icon: "/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png" },
        webpush: {
          notification: {
            title,
            body,
            icon: "/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png",
            vibrate: [200, 100, 200],
            tag: "spsd-departure",
            renotify: true,
          },
        },
      }),
    });

    if (res.ok) {
      console.log(`FCM sent to ${fcmToken.substring(0, 20)}...`);
      return true;
    }
    console.error(`FCM error: ${res.status} ${await res.text()}`);
    return false;
  } catch (e) {
    console.error("FCM error:", e);
    return false;
  }
}

/* ── Main handler ──────────────────────────────────────────── */

Deno.serve(async (_req) => {
  try {
    const now = Math.floor(Date.now() / 1000);

    const { data: subs, error } = await supabase
      .from("notification_subscriptions")
      .select("*")
      .eq("notified", false)
      .gt("expires_at", new Date().toISOString())
      .limit(100);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: "No active subscriptions", count: 0 }));
    }

    let notifiedCount = 0;

    for (const sub of subs) {
      let shouldNotify = false;
      const title = `${sub.route_short_name} \u2192 ${sub.headsign}`;
      let body = "";

      // Minute-based
      if (sub.notify_type === "minutes" && sub.notify_minutes) {
        const minutesLeft = Math.floor((sub.arrival_timestamp - now) / 60);
        if (minutesLeft <= sub.notify_minutes && minutesLeft >= 0) {
          shouldNotify = true;
          body = `Za ${minutesLeft} min na ${sub.station_name}! Vyraz!`;
        }
      }

      // Stop-based
      if (sub.notify_type === "stop" && sub.notify_stop_name) {
        try {
          const routeNum = sub.trip_id.split("_")[0];
          const res = await fetch(
            `https://api.golemio.cz/v2/vehiclepositions?routeShortName=${routeNum}&limit=30`,
            { headers: { "X-Access-Token": GOLEMIO_API_KEY } },
          );

          if (res.ok) {
            const data = await res.json();
            for (const f of (data.features || [])) {
              if (f.properties?.trip?.gtfs?.trip_id === sub.trip_id) {
                const lastStopSeq = f.properties.last_position?.last_stop?.sequence;

                const tripRes = await fetch(
                  `https://api.golemio.cz/v2/gtfs/trips/${sub.trip_id}?includeStopTimes=true&includeStops=true`,
                  { headers: { "X-Access-Token": GOLEMIO_API_KEY } },
                );

                if (tripRes.ok) {
                  const tripData = await tripRes.json();
                  const notifyStop = (tripData.stop_times || []).find((st: any) =>
                    st.stop?.properties?.stop_name === sub.notify_stop_name
                  );

                  if (notifyStop && lastStopSeq && lastStopSeq >= notifyStop.stop_sequence) {
                    shouldNotify = true;
                    body = `Proj\u00ed\u017ed\u00ed ${sub.notify_stop_name}! Bl\u00ed\u017e\u00ed se na ${sub.station_name}!`;
                  }
                }
                break;
              }
            }
          }
        } catch (e) {
          console.error("Vehicle check error:", e);
        }
      }

      if (shouldNotify && sub.push_endpoint && !sub.push_endpoint.startsWith("local-")) {
        await sendFCM(sub.push_endpoint, title, body);

        await supabase
          .from("notification_subscriptions")
          .update({ notified: true })
          .eq("id", sub.id);

        notifiedCount++;
      }
    }

    // Cleanup expired
    await supabase
      .from("notification_subscriptions")
      .delete()
      .lt("expires_at", new Date().toISOString());

    return new Response(
      JSON.stringify({ checked: subs.length, notified: notifiedCount }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
