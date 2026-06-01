import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile, UserRole } from "@/types/database";

export async function getProfileRole(
  supabase: SupabaseClient<Database>,
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
  supabase: SupabaseClient<Database>,
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
