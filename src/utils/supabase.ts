import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://yfcjsfuqeonmkjgetqsy.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_lExWfAp6JlbFewYBfNIfog_v-JXo3Nf";

// Inject FCM token (saved by firebase.ts) as `x-fcm-token` header on every
// request. RLS policies use this to ensure each device only reads/updates
// its own notification subscriptions.
const fetchWithFcmToken: typeof fetch = (input, init) => {
  const token = (typeof localStorage !== "undefined") ? localStorage.getItem("fcm_token") : null;
  const headers = new Headers(init?.headers);
  if (token) headers.set("x-fcm-token", token);
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: { fetch: fetchWithFcmToken },
});
