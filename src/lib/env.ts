const PLACEHOLDER_HOSTS = ["your-project.supabase.co", "xxxxxxxx.supabase.co"];

export function getSupabaseAnonEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel, then Redeploy."
    );
  }

  if (
    PLACEHOLDER_HOSTS.some((h) => url.includes(h)) ||
    anonKey.includes("your-anon-key")
  ) {
    throw new Error(
      "Supabase env vars are still placeholders. Use real values from Supabase → API, then Redeploy on Vercel."
    );
  }

  return { url, anonKey };
}

export function getAppUrl(fallback?: string) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    fallback ??
    "http://localhost:3000"
  );
}
