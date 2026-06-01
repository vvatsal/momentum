import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types/database";

/** Compatible with @supabase/ssr server and browser clients (avoids generic version mismatches). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppSupabaseClient = SupabaseClient<any, "public", any>;

export async function getProfileRole(
  supabase: AppSupabaseClient,
  userId: string
): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { role: UserRole }).role;
}

export async function getProfileByUserId(
  supabase: AppSupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Profile;
}
