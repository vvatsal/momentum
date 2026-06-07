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

    const isAuthorized = profile?.role === "superadmin" || profile?.role === "teacher" || profile?.role === "admin";
    if (!isAuthorized) throw new Error("Unauthorized");

    // Teachers can ONLY create students
    let targetRole = input.role;
    if (profile?.role === "teacher") {
        targetRole = "student";
    }

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
            role: targetRole,
            created_by: adminUser.id,
        }
    });

    if (createError) {
        console.error("Error creating user:", createError);
        return { ok: false, error: createError.message };
    }

    // Ensure profile has correct data and created_by reference
    const { error: profileError } = await adminClient
        .from("profiles")
        .update({
            full_name: fullName,
            role: targetRole,
            username: input.username,
            created_by: adminUser.id,
        })
        .eq("id", newUser.user.id);

    if (profileError) {
        console.error("Error updating profile:", profileError);
    }

    revalidatePath("/admin");
    return { ok: true, userId: newUser.user.id };
}

export async function changeUserPassword(userId: string, newPassword: string) {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) throw new Error("Not authenticated");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", adminUser.id)
        .single();

    const isAuthorized = profile?.role === "superadmin" || profile?.role === "teacher" || profile?.role === "admin";
    if (!isAuthorized) throw new Error("Unauthorized");

    const adminClient = createAdminClient();

    // If active user is a teacher, verify that they created the student they are changing password for
    if (profile?.role === "teacher") {
        const { data: targetProfile } = await adminClient
            .from("profiles")
            .select("role, created_by")
            .eq("id", userId)
            .single();

        if (!targetProfile || targetProfile.created_by !== adminUser.id || targetProfile.role !== "student") {
            throw new Error("Unauthorized to change password for this user");
        }
    }

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword,
    });

    if (error) {
        console.error("Error updating user password:", error);
        return { ok: false, error: error.message };
    }

    revalidatePath("/admin");
    return { ok: true };
}

export async function deleteUser(userId: string) {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) throw new Error("Not authenticated");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", adminUser.id)
        .single();

    const isAuthorized = profile?.role === "superadmin" || profile?.role === "teacher" || profile?.role === "admin";
    if (!isAuthorized) throw new Error("Unauthorized");

    const adminClient = createAdminClient();

    // If active user is a teacher, verify that they created this student
    if (profile?.role === "teacher") {
        const { data: targetProfile } = await adminClient
            .from("profiles")
            .select("role, created_by")
            .eq("id", userId)
            .single();

        if (!targetProfile || targetProfile.created_by !== adminUser.id || targetProfile.role !== "student") {
            throw new Error("Unauthorized to delete this user");
        }
    }

    // Delete student from auth (profile deletion cascades automatically)
    const { error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) {
        console.error("Error deleting user:", error);
        return { ok: false, error: error.message };
    }

    revalidatePath("/admin");
    return { ok: true };
}

export async function updateUser(userId: string, input: { firstName: string; lastName: string; username: string }) {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) throw new Error("Not authenticated");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", adminUser.id)
        .single();

    const isAuthorized = profile?.role === "superadmin" || profile?.role === "teacher" || profile?.role === "admin";
    if (!isAuthorized) throw new Error("Unauthorized");

    const adminClient = createAdminClient();

    // If active user is a teacher, verify that they created this student
    if (profile?.role === "teacher") {
        const { data: targetProfile } = await adminClient
            .from("profiles")
            .select("role, created_by")
            .eq("id", userId)
            .single();

        if (!targetProfile || targetProfile.created_by !== adminUser.id || targetProfile.role !== "student") {
            throw new Error("Unauthorized to edit this user");
        }
    }

    const fullName = `${input.firstName} ${input.lastName}`.trim();

    // Update in profiles table
    const { error } = await adminClient
        .from("profiles")
        .update({
            full_name: fullName,
            username: input.username,
        })
        .eq("id", userId);

    if (error) {
        console.error("Error updating profile:", error);
        return { ok: false, error: error.message };
    }

    revalidatePath("/admin");
    return { ok: true };
}
