"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function createUser(input: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email?: string;
    role: UserRole;
}) {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) throw new Error("Not authenticated");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", adminUser.id)
        .single();

    if (profile?.role !== "admin") throw new Error("Unauthorized");

    const adminClient = createAdminClient();

    // If email is not provided, generate a dummy one based on username
    const email = input.email || `${input.username}@momentum.internal`;
    const fullName = `${input.firstName} ${input.lastName}`.trim();

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            username: input.username,
        }
    });

    if (createError) {
        console.error("Error creating user:", createError);
        return { ok: false, error: createError.message };
    }

    // The profile might be created automatically by a trigger, but let's ensure it has the correct data
    const { error: profileError } = await adminClient
        .from("profiles")
        .update({
            full_name: fullName,
            role: input.role,
            username: input.username,
        })
        .eq("id", newUser.user.id);

    if (profileError) {
        console.error("Error updating profile:", profileError);
        // We don't return error here because the user is already created
    }

    revalidatePath("/admin/users");
    return { ok: true, userId: newUser.user.id };
}
