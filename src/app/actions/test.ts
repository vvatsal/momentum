"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyStudentsTestPublished } from "@/lib/email/publish-notify";
import { createClient } from "@/lib/supabase/server";
import {
  archiveTestSchema,
  createTestSchema,
  deleteQuestionSchema,
  mcqQuestionSchema,
  numericQuestionSchema,
  publishTestSchema,
  testMetadataSchema,
} from "@/lib/validations/test";
import type { McqCorrectAnswer, NumericCorrectAnswer, Question } from "@/types/database";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");
  return { supabase, userId: user.id };
}

function revalidateTest(testId: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/tests/${testId}`);
  revalidatePath(`/admin/tests/${testId}/reports`);
}

export async function createTest(
  formData: FormData
): Promise<ActionResult<{ testId: string }>> {
  const { supabase, userId } = await requireAdmin();
  const parsed = createTestSchema.safeParse({
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().fieldErrors.title?.[0] ?? "Invalid input" };
  }

  const { data, error } = await supabase
    .from("tests")
    .insert({
      title: parsed.data.title,
      status: "draft",
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create test" };
  }

  revalidatePath("/admin");
  return { ok: true, data: { testId: data.id } };
}

export async function updateTestMetadata(
  input: unknown
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = testMetadataSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid test details" };
  }

  const { testId, title, description, instructions, duration_minutes, starts_at, ends_at } =
    parsed.data;

  const { data: existing } = await supabase
    .from("tests")
    .select("is_locked, status")
    .eq("id", testId)
    .single();

  if (!existing) return { ok: false, error: "Test not found" };

  const payload: Record<string, unknown> = {
    description: description ?? null,
    instructions: instructions ?? null,
    starts_at: starts_at,
    ends_at: ends_at,
  };

  if (!existing.is_locked) {
    payload.title = title;
    payload.duration_minutes = duration_minutes;
  }

  const { error } = await supabase.from("tests").update(payload).eq("id", testId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateTest(testId);
  return { ok: true };
}

export async function saveMcqQuestion(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = mcqQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid MCQ question" };
  }

  const d = parsed.data;
  if (!d.options.includes(d.correct_option)) {
    return { ok: false, error: "Correct option must be one of the choices" };
  }

  const locked = await isTestLocked(supabase, d.testId);
  if (locked) return { ok: false, error: "Test is locked — cannot edit questions" };

  const correct_answer: McqCorrectAnswer = { option: d.correct_option };
  const row = {
    test_id: d.testId,
    type: "mcq" as const,
    question_text: d.question_text,
    marks: d.marks,
    options: d.options,
    correct_answer,
    explanation: d.explanation ?? null,
    numeric_tolerance: null,
  };

  if (d.questionId) {
    const { error } = await supabase
      .from("questions")
      .update(row)
      .eq("id", d.questionId)
      .eq("test_id", d.testId);
    if (error) return { ok: false, error: error.message };
  } else {
    const nextIndex = await nextQuestionIndex(supabase, d.testId);
    const { error } = await supabase.from("questions").insert({
      ...row,
      order_index: nextIndex,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidateTest(d.testId);
  return { ok: true };
}

export async function saveNumericQuestion(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = numericQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid numeric question" };
  }

  const d = parsed.data;
  const locked = await isTestLocked(supabase, d.testId);
  if (locked) return { ok: false, error: "Test is locked — cannot edit questions" };

  const correct_answer: NumericCorrectAnswer = { value: d.correct_value };
  const row = {
    test_id: d.testId,
    type: "numeric" as const,
    question_text: d.question_text,
    marks: d.marks,
    options: null,
    correct_answer,
    numeric_tolerance: d.numeric_tolerance,
    explanation: d.explanation ?? null,
  };

  if (d.questionId) {
    const { error } = await supabase
      .from("questions")
      .update(row)
      .eq("id", d.questionId)
      .eq("test_id", d.testId);
    if (error) return { ok: false, error: error.message };
  } else {
    const nextIndex = await nextQuestionIndex(supabase, d.testId);
    const { error } = await supabase.from("questions").insert({
      ...row,
      order_index: nextIndex,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidateTest(d.testId);
  return { ok: true };
}

export async function deleteQuestion(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = deleteQuestionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const { testId, questionId } = parsed.data;
  const locked = await isTestLocked(supabase, testId);
  if (locked) return { ok: false, error: "Test is locked — cannot delete questions" };

  const { data: q } = await supabase
    .from("questions")
    .select("order_index")
    .eq("id", questionId)
    .eq("test_id", testId)
    .single();

  if (!q) return { ok: false, error: "Question not found" };

  const { error: delError } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId);

  if (delError) return { ok: false, error: delError.message };

  const { data: rest } = await supabase
    .from("questions")
    .select("id, order_index")
    .eq("test_id", testId)
    .order("order_index", { ascending: true });

  if (rest) {
    for (let i = 0; i < rest.length; i++) {
      if (rest[i].order_index !== i) {
        await supabase
          .from("questions")
          .update({ order_index: i })
          .eq("id", rest[i].id);
      }
    }
  }

  revalidateTest(testId);
  return { ok: true };
}

export async function publishTest(input: unknown): Promise<ActionResult<{ email?: string }>> {
  const { supabase } = await requireAdmin();
  const parsed = publishTestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const { testId, sendEmails } = parsed.data;

  const { data: test } = await supabase
    .from("tests")
    .select("id, title, status")
    .eq("id", testId)
    .single();

  if (!test) return { ok: false, error: "Test not found" };

  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("test_id", testId);

  if (!count || count < 1) {
    return { ok: false, error: "Add at least one question before publishing" };
  }

  const { error } = await supabase
    .from("tests")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", testId);

  if (error) return { ok: false, error: error.message };

  let emailMessage: string | undefined;
  if (sendEmails) {
    const result = await notifyStudentsTestPublished(testId, test.title);
    if (result.skipped && result.message) {
      emailMessage = result.message;
    } else if (!result.skipped) {
      emailMessage = `Emails: ${result.sent} sent, ${result.failed} failed`;
    }
  }

  revalidateTest(testId);
  revalidatePath("/dashboard");
  return { ok: true, data: { email: emailMessage } };
}

export async function archiveTest(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = archiveTestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const { error } = await supabase
    .from("tests")
    .update({ status: "archived" })
    .eq("id", parsed.data.testId);

  if (error) return { ok: false, error: error.message };

  revalidateTest(parsed.data.testId);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteDraftTest(testId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const { data: test } = await supabase
    .from("tests")
    .select("status, is_locked")
    .eq("id", testId)
    .single();

  if (!test) return { ok: false, error: "Test not found" };
  if (test.status !== "draft") {
    return { ok: false, error: "Only draft tests can be deleted" };
  }
  if (test.is_locked) {
    return { ok: false, error: "Test has attempts and cannot be deleted" };
  }

  const { error } = await supabase.from("tests").delete().eq("id", testId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

async function isTestLocked(
  supabase: Awaited<ReturnType<typeof createClient>>,
  testId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("tests")
    .select("is_locked")
    .eq("id", testId)
    .single();
  return !!data?.is_locked;
}

async function nextQuestionIndex(
  supabase: Awaited<ReturnType<typeof createClient>>,
  testId: string
): Promise<number> {
  const { data } = await supabase
    .from("questions")
    .select("order_index")
    .eq("test_id", testId)
    .order("order_index", { ascending: false })
    .limit(1);

  if (!data?.length) return 0;
  return (data[0] as Pick<Question, "order_index">).order_index + 1;
}
