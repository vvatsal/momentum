import type { Profile, UserRole } from "@/types/database";

/** Minimal shape shared by server and browser Supabase clients. */
export type AppSupabaseClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

export function asProfileClient(client: unknown): AppSupabaseClient {
  return client as AppSupabaseClient;
}

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
