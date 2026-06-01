import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/supabase/profile";
import type { Profile } from "@/types/database";
import { redirect } from "next/navigation";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return getProfileByUserId(supabase, user.id);
}

export async function requireProfile(role?: "admin" | "student") {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (role && profile.role !== role) {
    redirect(profile.role === "admin" ? "/admin" : "/dashboard");
  }
  return profile;
}
