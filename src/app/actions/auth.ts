"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resolveUsernameToEmail(input: string): Promise<string> {
  const normalized = input.trim();
  if (normalized.includes("@")) {
    return normalized;
  }

  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("profiles")
      .select("email")
      .eq("username", normalized)
      .maybeSingle();

    if (data?.email) {
      return data.email;
    }
  } catch (err) {
    console.error("Failed to resolve username:", err);
  }

  // Fallback to internal dummy email format
  return `${normalized}@momentum.internal`;
}
