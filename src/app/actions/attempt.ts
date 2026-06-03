"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pickResumeQuestionId } from "@/lib/attempt/resume";
import { scoreResponse, toSafeQuestion, type SafeQuestion } from "@/lib/scoring";
import {
  finalSubmitSchema,
  flushTimingSchema,
  saveAnswerSchema,
  saveTimingSchema,
  syncNavigationSchema,
  visitQuestionSchema,
} from "@/lib/validations/attempt";
import type {
  Attempt,
  Question,
  Response,
  ResponseStatus,
  Test,
} from "@/types/database";

export type AttemptResponseState = {
  question_id: string;
  status: ResponseStatus;
  selected_option: string | null;
  numeric_answer: number | null;
  time_spent_seconds: number;
};

export type AttemptBundle = {
  test: Pick<
    Test,
    "id" | "title" | "instructions" | "duration_minutes" | "description"
  >;
  attempt: Attempt;
  questions: SafeQuestion[];
  responses: AttemptResponseState[];
  resumeQuestionId: string;
};

async function requireStudent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student" && profile?.role !== "admin") redirect("/login");
  return { supabase, userId: user.id, role: profile.role };
}

async function getOwnedAttempt(supabase: Awaited<ReturnType<typeof createClient>>, attemptId: string, userId: string) {
  const { data: attempt, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("student_id", userId)
    .single();

  if (error || !attempt) throw new Error("Attempt not found");
  return attempt as Attempt;
}

export async function getTestForStudent(testId: string) {
  const { supabase } = await requireStudent();

  const { data: test, error } = await supabase
    .from("tests")
    .select("id, title, description, instructions, duration_minutes, status")
    .eq("id", testId)
    .single();

  if (error || !test) return null;
  return test;
}

export async function getAttemptForTest(testId: string) {
  const { supabase, userId } = await requireStudent();

  const { data } = await supabase
    .from("attempts")
    .select("id, status, submitted_at, total_score, max_score")
    .eq("test_id", testId)
    .eq("student_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function startOrResumeAttempt(testId: string): Promise<AttemptBundle> {
  const { supabase, userId } = await requireStudent();

  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("id, title, description, instructions, duration_minutes, status")
    .eq("id", testId)
    .single();

  if (testError || !test) throw new Error("Test not found");

  const isAdmin = (await supabase.from("profiles").select("role").eq("id", userId).single()).data?.role === "admin";
  const selectFields = isAdmin
    ? "id, test_id, order_index, type, question_text, image_url, marks, options, correct_answer, numeric_tolerance"
    : "id, test_id, order_index, type, question_text, image_url, marks, options";

  const { data: questionsRaw, error: qError } = await supabase
    .from("questions")
    .select(selectFields)
    .eq("test_id", testId)
    .order("order_index", { ascending: true });

  if (qError || !questionsRaw?.length) {
    throw new Error("This test has no questions yet.");
  }

  const questions = (questionsRaw as any[]).map(toSafeQuestion);

  let { data: attempt } = await supabase
    .from("attempts")
    .select("*")
    .eq("test_id", testId)
    .eq("student_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (attempt?.status === "submitted" && !isAdmin) {
    redirect(`/tests/${testId}/summary`);
  }

  // If admin and previous attempt is submitted, or no attempt exists, create new
  if (!attempt || (attempt.status === "submitted" && isAdmin)) {
    attempt = null; // Force creation
  }

  const now = new Date().toISOString();

  if (!attempt) {
    const { data: created, error: createError } = await supabase
      .from("attempts")
      .insert({
        test_id: testId,
        student_id: userId,
        status: "in_progress",
        started_at: now,
        last_seen_at: now,
        current_question_id: questions[0].id,
      })
      .select("*")
      .single();

    if (createError || !created) throw new Error("Could not start attempt");

    attempt = created as Attempt;

    const responseRows = questions.map((q) => ({
      attempt_id: attempt!.id,
      question_id: q.id,
      status: "unanswered" as const,
    }));

    const { error: respError } = await supabase.from("responses").insert(responseRows);
    if (respError) throw new Error("Could not initialize answers");
  }

  const attemptRow = attempt as Attempt;

  const { data: responsesRaw } = await supabase
    .from("responses")
    .select("question_id, status, selected_option, numeric_answer, time_spent_seconds, last_seen_at")
    .eq("attempt_id", attemptRow.id);

  const responseMap = new Map(
    (responsesRaw ?? []).map((r) => [r.question_id, r as Response])
  );

  const responses: AttemptResponseState[] = questions.map((q) => {
    const r = responseMap.get(q.id);
    return {
      question_id: q.id,
      status: (r?.status ?? "unanswered") as ResponseStatus,
      selected_option: r?.selected_option ?? null,
      numeric_answer: r?.numeric_answer != null ? Number(r.numeric_answer) : null,
      time_spent_seconds: r?.time_spent_seconds ?? 0,
    };
  });

  const resumeQuestionId = pickResumeQuestionId(
    questions.map((q) => ({
      question_id: q.id,
      order_index: q.order_index,
      status: responses.find((r) => r.question_id === q.id)!.status,
      last_seen_at: responseMap.get(q.id)?.last_seen_at ?? null,
    })),
    attemptRow.current_question_id
  );

  const enterRow = responseMap.get(resumeQuestionId);
  await supabase
    .from("responses")
    .update({
      visited_count: (enterRow?.visited_count ?? 0) + 1,
      first_seen_at: enterRow?.first_seen_at ?? now,
      last_seen_at: now,
    })
    .eq("attempt_id", attemptRow.id)
    .eq("question_id", resumeQuestionId);

  await supabase
    .from("attempts")
    .update({ current_question_id: resumeQuestionId, last_seen_at: now })
    .eq("id", attemptRow.id)
    .eq("status", "in_progress");

  return {
    test: {
      id: test.id,
      title: test.title,
      description: test.description,
      instructions: test.instructions,
      duration_minutes: test.duration_minutes,
    },
    attempt: { ...attemptRow, current_question_id: resumeQuestionId },
    questions,
    responses,
    resumeQuestionId,
  };
}

export async function saveAnswer(input: unknown) {
  const parsed = saveAnswerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }

  const { supabase, userId } = await requireStudent();
  const attempt = await getOwnedAttempt(supabase, parsed.data.attemptId, userId);

  if (attempt.status !== "in_progress") {
    return { ok: false as const, error: "Attempt already submitted" };
  }

  const now = new Date().toISOString();
  const { status, selectedOption, numericAnswer, questionId } = parsed.data;

  const patch: Record<string, unknown> = {
    status,
    last_seen_at: now,
    updated_at: now,
  };

  if (status === "answered") {
    patch.selected_option = selectedOption ?? null;
    patch.numeric_answer = numericAnswer ?? null;
    patch.answered_at = now;
  } else if (status === "skipped") {
    patch.selected_option = null;
    patch.numeric_answer = null;
    patch.answered_at = null;
  } else {
    patch.selected_option = null;
    patch.numeric_answer = null;
    patch.answered_at = null;
  }

  const { error } = await supabase
    .from("responses")
    .update(patch)
    .eq("attempt_id", attempt.id)
    .eq("question_id", questionId);

  if (error) return { ok: false as const, error: error.message };

  await supabase
    .from("attempts")
    .update({ last_seen_at: now, current_question_id: questionId })
    .eq("id", attempt.id)
    .eq("status", "in_progress");

  return { ok: true as const };
}

export async function saveTiming(input: unknown) {
  const parsed = saveTimingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }

  const { supabase, userId } = await requireStudent();
  const attempt = await getOwnedAttempt(supabase, parsed.data.attemptId, userId);

  if (attempt.status !== "in_progress") {
    return { ok: false as const, error: "Attempt already submitted" };
  }

  const { questionId, deltaSeconds } = parsed.data;
  if (deltaSeconds <= 0) return { ok: true as const };

  const { data: response } = await supabase
    .from("responses")
    .select("time_spent_seconds")
    .eq("attempt_id", attempt.id)
    .eq("question_id", questionId)
    .single();

  const prev = response?.time_spent_seconds ?? 0;
  const now = new Date().toISOString();

  const { error: rErr } = await supabase
    .from("responses")
    .update({
      time_spent_seconds: prev + deltaSeconds,
      last_seen_at: now,
    })
    .eq("attempt_id", attempt.id)
    .eq("question_id", questionId);

  if (rErr) return { ok: false as const, error: rErr.message };

  const { error: aErr } = await supabase
    .from("attempts")
    .update({
      total_time_seconds: attempt.total_time_seconds + deltaSeconds,
      last_seen_at: now,
    })
    .eq("id", attempt.id)
    .eq("status", "in_progress");

  if (aErr) return { ok: false as const, error: aErr.message };

  return { ok: true as const };
}

export async function recordQuestionVisit(input: unknown) {
  const parsed = visitQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }

  const { supabase, userId } = await requireStudent();
  const attempt = await getOwnedAttempt(supabase, parsed.data.attemptId, userId);

  if (attempt.status !== "in_progress") {
    return { ok: false as const, error: "Attempt already submitted" };
  }

  const now = new Date().toISOString();
  const { questionId } = parsed.data;

  const { data: existing } = await supabase
    .from("responses")
    .select("visited_count, first_seen_at")
    .eq("attempt_id", attempt.id)
    .eq("question_id", questionId)
    .single();

  const { error } = await supabase
    .from("responses")
    .update({
      visited_count: (existing?.visited_count ?? 0) + 1,
      first_seen_at: existing?.first_seen_at ?? now,
      last_seen_at: now,
    })
    .eq("attempt_id", attempt.id)
    .eq("question_id", questionId);

  if (error) return { ok: false as const, error: error.message };

  await supabase
    .from("attempts")
    .update({ current_question_id: questionId, last_seen_at: now })
    .eq("id", attempt.id)
    .eq("status", "in_progress");

  return { ok: true as const };
}

/** One round-trip when changing questions (timing + answer + visit). */
export async function syncQuestionNavigation(input: unknown) {
  const parsed = syncNavigationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }

  const { supabase, userId } = await requireStudent();
  const attempt = await getOwnedAttempt(supabase, parsed.data.attemptId, userId);

  if (attempt.status !== "in_progress") {
    return { ok: false as const, error: "Attempt already submitted" };
  }

  const now = new Date().toISOString();
  const {
    leaveQuestionId,
    enterQuestionId,
    leaveTimeDelta,
    leaveAnswer,
  } = parsed.data;

  let newAttemptTotal = attempt.total_time_seconds;

  if (leaveTimeDelta > 0 || leaveAnswer) {
    const { data: leaveRow } = await supabase
      .from("responses")
      .select("time_spent_seconds, visited_count, first_seen_at")
      .eq("attempt_id", attempt.id)
      .eq("question_id", leaveQuestionId)
      .single();

    const leavePatch: Record<string, unknown> = {
      last_seen_at: now,
      updated_at: now,
    };

    if (leaveTimeDelta > 0) {
      leavePatch.time_spent_seconds =
        (leaveRow?.time_spent_seconds ?? 0) + leaveTimeDelta;
      newAttemptTotal += leaveTimeDelta;
    }

    if (leaveAnswer) {
      leavePatch.status = leaveAnswer.status;
      if (leaveAnswer.status === "answered") {
        leavePatch.selected_option = leaveAnswer.selectedOption ?? null;
        leavePatch.numeric_answer = leaveAnswer.numericAnswer ?? null;
        leavePatch.answered_at = now;
      } else if (leaveAnswer.status === "skipped") {
        leavePatch.selected_option = null;
        leavePatch.numeric_answer = null;
        leavePatch.answered_at = null;
      }
    }

    const { error: leaveErr } = await supabase
      .from("responses")
      .update(leavePatch)
      .eq("attempt_id", attempt.id)
      .eq("question_id", leaveQuestionId);

    if (leaveErr) return { ok: false as const, error: leaveErr.message };
  }

  const { data: enterRow } = await supabase
    .from("responses")
    .select("visited_count, first_seen_at")
    .eq("attempt_id", attempt.id)
    .eq("question_id", enterQuestionId)
    .single();

  const { error: enterErr } = await supabase
    .from("responses")
    .update({
      visited_count: (enterRow?.visited_count ?? 0) + 1,
      first_seen_at: enterRow?.first_seen_at ?? now,
      last_seen_at: now,
      updated_at: now,
    })
    .eq("attempt_id", attempt.id)
    .eq("question_id", enterQuestionId);

  if (enterErr) return { ok: false as const, error: enterErr.message };

  const { error: attemptErr } = await supabase
    .from("attempts")
    .update({
      current_question_id: enterQuestionId,
      last_seen_at: now,
      total_time_seconds: newAttemptTotal,
    })
    .eq("id", attempt.id)
    .eq("status", "in_progress");

  if (attemptErr) return { ok: false as const, error: attemptErr.message };

  return { ok: true as const };
}

/** Background timing flush without blocking navigation. */
export async function flushQuestionTiming(input: unknown) {
  const parsed = flushTimingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }
  return saveTiming(parsed.data);
}

export async function finalSubmit(input: unknown) {
  const parsed = finalSubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }

  const { supabase, userId } = await requireStudent();
  const attempt = await getOwnedAttempt(supabase, parsed.data.attemptId, userId);

  if (attempt.status === "submitted") {
    return { ok: true as const, testId: attempt.test_id };
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("test_id", attempt.test_id);

  const { data: responses } = await supabase
    .from("responses")
    .select("*")
    .eq("attempt_id", attempt.id);

  if (!questions?.length || !responses) {
    return { ok: false as const, error: "Missing test data" };
  }

  let totalScore = 0;
  let maxScore = 0;

  const scoreUpdates: PromiseLike<unknown>[] = [];

  for (const q of questions as Question[]) {
    maxScore += Number(q.marks);
    const r = responses.find((x) => x.question_id === q.id) as Response | undefined;
    if (!r) continue;

    const { isCorrect, awardedMarks } = scoreResponse(
      q,
      r.selected_option,
      r.numeric_answer != null ? Number(r.numeric_answer) : null
    );

    totalScore += awardedMarks;

    scoreUpdates.push(
      supabase
        .from("responses")
        .update({
          is_correct: isCorrect,
          awarded_marks: awardedMarks,
        })
        .eq("id", r.id)
        .then((res) => res)
    );
  }

  await Promise.all(scoreUpdates);

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("attempts")
    .update({
      status: "submitted",
      submitted_at: now,
      last_seen_at: now,
      total_score: totalScore,
      max_score: maxScore,
    })
    .eq("id", attempt.id)
    .eq("status", "in_progress")
    .select("test_id")
    .maybeSingle();

  if (error || !updated) {
    return { ok: false as const, error: "Submit failed or already submitted" };
  }

  revalidatePath(`/tests/${attempt.test_id}`);
  revalidatePath(`/tests/${attempt.test_id}/summary`);
  revalidatePath("/dashboard");

  return { ok: true as const, testId: attempt.test_id };
}

export async function getSubmittedSummary(testId: string) {
  const { supabase, userId } = await requireStudent();

  const { data: attempt } = await supabase
    .from("attempts")
    .select("*")
    .eq("test_id", testId)
    .eq("student_id", userId)
    .single();

  if (!attempt || attempt.status !== "submitted") return null;

  const { data: test } = await supabase
    .from("tests")
    .select("id, title")
    .eq("id", testId)
    .single();

  const { data: responses } = await supabase
    .from("responses")
    .select(
      "question_id, status, is_correct, awarded_marks, time_spent_seconds, selected_option, numeric_answer"
    )
    .eq("attempt_id", attempt.id);

  const { data: questions } = await supabase
    .from("questions")
    .select("id, order_index, question_text, marks, type, options, correct_answer, explanation")
    .eq("test_id", testId)
    .order("order_index", { ascending: true });

  return {
    test,
    attempt: attempt as Attempt,
    questions: questions ?? [],
    responses: responses ?? [],
  };
}
