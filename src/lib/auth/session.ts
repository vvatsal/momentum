import { createClient } from "@/lib/supabase/server";
import { asProfileClient, getProfileByUserId } from "@/lib/supabase/profile";
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

  return getProfileByUserId(asProfileClient(supabase), user.id);
}

export async function requireProfile(role?: "superadmin" | "teacher" | "student" | "admin-or-teacher" | "admin") {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (role) {
    const isAuthorized =
      (role === "admin-or-teacher" || role === "admin")
        ? (profile.role === "superadmin" || profile.role === "teacher" || profile.role === "admin")
        : profile.role === role;

    if (!isAuthorized) {
      const isPrivileged = profile.role === "superadmin" || profile.role === "teacher" || profile.role === "admin";
      redirect(isPrivileged ? "/admin" : "/dashboard");
    }
  }
  return profile;
}
