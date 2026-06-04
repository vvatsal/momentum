"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toSafeQuestion } from "@/lib/scoring";
import type { Attempt, Response, Question } from "@/types/database";

export type AttemptResponseState = Response & {
  time_spent_seconds: number;
  awarded_marks: number;
};

export type AttemptBundle = {
  test: any;
  attempt: Attempt;
  questions: any[];
  responses: AttemptResponseState[];
  resumeQuestionId: string;
};

async function requireStudent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase: null, userId: null, role: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { supabase, userId: user.id, role: profile?.role };
}

async function getOwnedAttempt(supabase: any, attemptId: string, userId: string) {
  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("student_id", userId)
    .single();

  if (error || !data) throw new Error("Attempt not found or access denied");
  return data as Attempt;
}

export async function getAttemptForTest(testId: string) {
  const { supabase, userId } = await requireStudent();
  if (!supabase || !userId) return null;

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

export async function startOrResumeAttempt(testId: string, forceNew = false): Promise<AttemptBundle> {
  const { supabase, userId, role } = await requireStudent();

  if (!supabase || !userId) {
    redirect("/login");
  }

  if (role !== "student" && role !== "admin") {
    redirect("/login");
  }

  const isAdmin = role === "admin";

  const selectFields = isAdmin
    ? "id, test_id, order_index, type, question_text, image_url, marks, options, correct_answer, numeric_tolerance"
    : "id, test_id, order_index, type, question_text, image_url, marks, options";

  // Parallelize database queries to avoid sequential roundtrips
  const [testRes, questionsRes, attemptRes] = await Promise.all([
    supabase
      .from("tests")
      .select("id, title, description, instructions, duration_minutes, status")
      .eq("id", testId)
      .single(),
    supabase
      .from("questions")
      .select(selectFields)
      .eq("test_id", testId)
      .order("order_index", { ascending: true }),
    supabase
      .from("attempts")
      .select("*")
      .eq("test_id", testId)
      .eq("student_id", userId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data: test, error: testError } = testRes;
  const { data: questionsRaw, error: qError } = questionsRes;
  let { data: attempt } = attemptRes;

  if (testError || !test) throw new Error("Test not found");

  if (qError || !questionsRaw?.length) {
    throw new Error("This test has no questions yet.");
  }

  const questions = (questionsRaw as any[]).map(toSafeQuestion);

  // Handle redirect outside of try/catch
  if (attempt?.status === "submitted" && !isAdmin && !forceNew) {
    redirect(`/tests/${testId}/summary`);
  }

  if (!attempt || (attempt.status === "submitted" && (isAdmin || forceNew))) {
    const now = new Date().toISOString();
    try {
      const { data: created, error: createError } = await supabase
        .from("attempts")
        .insert({
          test_id: testId,
          student_id: userId,
          status: "in_progress",
          started_at: now,
          last_seen_at: now,
          current_question_id: questions[0]?.id,
        })
        .select("*")
        .single();

      if (createError || !created) {
        console.error("Error creating attempt:", createError);
        throw new Error("Could not start attempt: " + (createError?.message || "Unknown error"));
      }

      attempt = created;

      const responseRows = questions.map((q) => ({
        attempt_id: attempt!.id,
        question_id: q.id,
        status: "unanswered" as const,
      }));

      const { error: respError } = await supabase
        .from("responses")
        .insert(responseRows);

      if (respError) {
        console.error("Error creating responses:", respError);
        throw new Error("Could not initialize responses");
      }
    } catch (err) {
      console.error("Failed to start attempt:", err);
      throw err;
    }
  }

  if (!attempt) throw new Error("Failed to load or create attempt");

  const { data: responsesRaw, error: rError } = await supabase
    .from("responses")
    .select("*")
    .eq("attempt_id", attempt.id);

  if (rError) throw new Error("Could not load responses");

  const responses = (responsesRaw as any[]).map((r) => ({
    ...r,
    time_spent_seconds: Number(r.time_spent_seconds),
    awarded_marks: Number(r.awarded_marks),
  }));

  return {
    test,
    attempt: attempt as Attempt,
    questions,
    responses,
    resumeQuestionId: attempt.current_question_id || questions[0].id,
  };
}

export async function syncQuestionNavigation(input: {
  attemptId: string;
  leaveQuestionId: string;
  enterQuestionId: string;
  leaveTimeDelta: number;
  leaveAnswer?: {
    status: "answered" | "skipped" | "unanswered";
    selectedOption?: string | null;
    numericAnswer?: number | null;
  };
}) {
  try {
    const { supabase, userId } = await requireStudent();
    if (!supabase || !userId) return { ok: false, error: "Not authenticated" };

    const { attemptId, leaveQuestionId, enterQuestionId, leaveTimeDelta, leaveAnswer } = input;
    await getOwnedAttempt(supabase, attemptId, userId);

    // 1. Update current question
    await supabase
      .from("attempts")
      .update({
        current_question_id: enterQuestionId,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", attemptId);

    // 2. Flush timing for the question we just left
    if (leaveQuestionId) {
      const { data: resp } = await supabase
        .from("responses")
        .select("time_spent_seconds")
        .eq("attempt_id", attemptId)
        .eq("question_id", leaveQuestionId)
        .single();

      const newTime = (Number(resp?.time_spent_seconds) || 0) + leaveTimeDelta;

      const updateData: any = {
        time_spent_seconds: newTime,
        updated_at: new Date().toISOString(),
      };

      if (leaveAnswer) {
        updateData.status = leaveAnswer.status;
        updateData.selected_option = leaveAnswer.selectedOption;
        updateData.numeric_answer = leaveAnswer.numericAnswer;
      }

      await supabase
        .from("responses")
        .update(updateData)
        .eq("attempt_id", attemptId)
        .eq("question_id", leaveQuestionId);
    }
    return { ok: true };
  } catch (err) {
    console.error("Sync error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Sync failed" };
  }
}

export async function flushQuestionTiming(input: {
  attemptId: string;
  questionId: string;
  deltaSeconds: number;
  status?: "answered" | "skipped" | "unanswered";
  selectedOption?: string | null;
  numericAnswer?: number | null;
}) {
  try {
    const { supabase, userId } = await requireStudent();
    if (!supabase || !userId) return;

    const { attemptId, questionId, deltaSeconds, status, selectedOption, numericAnswer } = input;
    await getOwnedAttempt(supabase, attemptId, userId);

    const { data: resp } = await supabase
      .from("responses")
      .select("time_spent_seconds")
      .eq("attempt_id", attemptId)
      .eq("question_id", questionId)
      .single();

    const newTime = (Number(resp?.time_spent_seconds) || 0) + deltaSeconds;

    const updateData: any = {
      time_spent_seconds: newTime,
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (selectedOption !== undefined) updateData.selected_option = selectedOption;
    if (numericAnswer !== undefined) updateData.numeric_answer = numericAnswer;

    await supabase
      .from("responses")
      .update(updateData)
      .eq("attempt_id", attemptId)
      .eq("question_id", questionId);
  } catch (err) {
    console.error("Flush timing error:", err);
  }
}

export async function finalSubmit(input: { attemptId: string }) {
  try {
    const { attemptId } = input;
    const { supabase, userId } = await requireStudent();
    if (!supabase || !userId) return { ok: false, error: "Not authenticated" };

    const attempt = await getOwnedAttempt(supabase, attemptId, userId);
    if (attempt.status === "submitted") return { ok: true };

    const { data: questions } = await supabase
      .from("questions")
      .select("*")
      .eq("test_id", attempt.test_id);

    const { data: responses } = await supabase
      .from("responses")
      .select("*")
      .eq("attempt_id", attemptId);

    if (!questions || !responses) throw new Error("Could not load data for scoring");

    let totalScore = 0;
    let maxScore = 0;

    const { scoreResponse } = await import("@/lib/scoring");

    for (const q of questions) {
      maxScore += Number(q.marks);
      const r = responses.find((x) => x.question_id === q.id);
      if (r) {
        const { isCorrect, awardedMarks } = scoreResponse(q, r.selected_option, r.numeric_answer);
        totalScore += awardedMarks;
        await supabase
          .from("responses")
          .update({ awarded_marks: awardedMarks, is_correct: isCorrect })
          .eq("id", r.id);
      }
    }

    const totalTimeSeconds = (responses || []).reduce(
      (acc, r) => acc + (Number(r.time_spent_seconds) || 0),
      0
    );

    await supabase
      .from("attempts")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        total_score: totalScore,
        max_score: maxScore,
        total_time_seconds: totalTimeSeconds,
      })
      .eq("id", attemptId);

    return { ok: true };
  } catch (err) {
    console.error("Submit error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Submit failed" };
  }
}

export async function getSubmittedSummary(testId: string) {
  const { supabase, userId } = await requireStudent();
  if (!supabase || !userId) return null;

  const { data: attempt } = await supabase
    .from("attempts")
    .select("*")
    .eq("test_id", testId)
    .eq("student_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (!attempt || attempt.status !== "submitted") return null;

  const { data: test } = await supabase
    .from("tests")
    .select("*")
    .eq("id", testId)
    .single();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("test_id", testId)
    .order("order_index", { ascending: true });

  const { data: responses } = await supabase
    .from("responses")
    .select("*")
    .eq("attempt_id", attempt.id);

  return {
    test,
    attempt,
    questions: (questions || []).map(toSafeQuestion),
    responses: (responses || []) as AttemptResponseState[],
  };
}

export async function getTestForStudent(testId: string) {
  const { supabase } = await requireStudent();
  if (!supabase) return null;

  const { data } = await supabase
    .from("tests")
    .select("id, title, description, instructions, duration_minutes, status")
    .eq("id", testId)
    .single();

  return data;
}
