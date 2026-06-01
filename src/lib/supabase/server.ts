import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonEnv } from "@/lib/env";
import type { CookieToSet } from "@/lib/supabase/cookies";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseAnonEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component — middleware refreshes session
        }
      },
    },
  });
}
