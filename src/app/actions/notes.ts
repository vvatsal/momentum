"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getNotes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select(`
      *,
      profiles:created_by (
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
  return data || [];
}

export async function uploadNoteAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Verify role is superadmin or teacher
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAuthorized = profile?.role === "superadmin" || profile?.role === "teacher" || profile?.role === "admin";
  if (!isAuthorized) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const fileType = formData.get("fileType") as "pdf" | "markdown";
  const content = formData.get("content") as string;
  const file = formData.get("file") as File | null;

  if (!title) {
    return { ok: false, error: "Title is required" };
  }

  const adminClient = createAdminClient();

  // Create storage bucket if not exists
  try {
    const { data: buckets } = await adminClient.storage.listBuckets();
    if (!buckets?.some((b) => b.name === "notes")) {
      const { error: bucketError } = await adminClient.storage.createBucket("notes", {
        public: true,
      });
      if (bucketError) console.error("Error creating bucket:", bucketError);
    }
  } catch (err) {
    console.error("Failed to check/create bucket:", err);
  }

  let filePath = null;
  let inlineContent = content || null;

  if (fileType === "pdf") {
    if (!file || file.size === 0) {
      return { ok: false, error: "PDF file is required for PDF type" };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("notes")
      .upload(fileName, buffer, {
        contentType: file.type,
        duplex: "half",
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return { ok: false, error: `Upload failed: ${uploadError.message}` };
    }
    filePath = uploadData.path;
  } else if (fileType === "markdown" && file && file.size > 0 && file.name.endsWith(".md")) {
    // If they uploaded a .md file instead of writing in the textarea
    const text = await file.text();
    inlineContent = text;
  }

  // Insert into DB
  const { error: dbError } = await adminClient.from("notes").insert({
    title,
    description: description || null,
    file_path: filePath,
    file_type: fileType,
    content: inlineContent,
    created_by: user.id,
  });

  if (dbError) {
    console.error("Error saving note metadata:", dbError);
    // Cleanup uploaded file if DB save failed
    if (filePath) {
      await adminClient.storage.from("notes").remove([filePath]);
    }
    return { ok: false, error: dbError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteNoteAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Get note uploader
  const { data: note } = await supabase
    .from("notes")
    .select("created_by, file_path")
    .eq("id", id)
    .single();

  if (!note) return { ok: false, error: "Note not found" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAuthorized =
    profile?.role === "superadmin" ||
    profile?.role === "admin" ||
    note.created_by === user.id;

  if (!isAuthorized) throw new Error("Unauthorized");

  const adminClient = createAdminClient();

  // Remove file from storage if it exists
  if (note.file_path) {
    const { error: removeError } = await adminClient.storage
      .from("notes")
      .remove([note.file_path]);
    if (removeError) {
      console.error("Error removing storage file:", removeError);
    }
  }

  // Delete from DB
  const { error: deleteError } = await adminClient
    .from("notes")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Error deleting note metadata:", deleteError);
    return { ok: false, error: deleteError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true };
}
