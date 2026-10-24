import { createClient } from "@supabase/supabase-js";

/** Server-only Supabase admin client. Never import this from a portal bundle. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin provisioning is not configured.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
