import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://yfcjsfuqeonmkjgetqsy.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_lExWfAp6JlbFewYBfNIfog_v-JXo3Nf";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
