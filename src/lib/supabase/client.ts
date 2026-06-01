import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonEnv } from "@/lib/env";

export function createClient() {
  const { url, anonKey } = getSupabaseAnonEnv();
  return createBrowserClient(url, anonKey);
}
