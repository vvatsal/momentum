import { createBrowserClient } from "@supabase/ssr";

/** Untyped browser client — avoids `never` inference on partial selects during build. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
