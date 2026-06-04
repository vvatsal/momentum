import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/session";
import { buildAttemptsCsv, buildResponsesCsv, type AttemptReportRow, type ResponseReportRow } from "@/lib/reports/csv";
import { createClient } from "@/lib/supabase/server";
import { listAttemptsForTest, getTestForAdmin, listQuestionsForTest } from "@/lib/supabase/queries";

export async function GET(
  request: Request,
  { params }: { params: { testId: string } }
) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const test = await getTestForAdmin(supabase, params.testId);
  if (!test) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const attempts = await listAttemptsForTest(supabase, params.testId);
  const slug = test.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  // If requesting detailed responses report (includes detailed time spent per question)
  if (type === "responses") {
    const questions = await listQuestionsForTest(supabase, params.testId);

    const attemptIds = attempts.map((a) => a.id);
    const { data: responsesRaw } = await supabase
      .from("responses")
      .select("*")
      .in("attempt_id", attemptIds);

    const responses = responsesRaw || [];

    const rows: ResponseReportRow[] = [];
    for (const a of attempts) {
      for (const q of questions) {
        const r = responses.find(
          (x) => x.attempt_id === a.id && x.question_id === q.id
        );
        rows.push({
          attempt_id: a.id,
          student_email: a.student.email,
          question_order: q.order_index + 1,
          question_type: q.type,
          question_text: q.question_text,
          status: r?.status ?? "unanswered",
          selected_option: r?.selected_option ?? null,
          numeric_answer: r?.numeric_answer != null ? Number(r.numeric_answer) : null,
          is_correct: r?.is_correct ?? null,
          awarded_marks: r?.awarded_marks != null ? Number(r.awarded_marks) : null,
          time_spent_seconds: r?.time_spent_seconds ? Number(r.time_spent_seconds) : 0,
        });
      }
    }

    const csv = buildResponsesCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}-responses-details.csv"`,
      },
    });
  }

  // Default: overall attempts summary
  const rows: AttemptReportRow[] = attempts.map((a) => ({
    attempt_id: a.id,
    student_email: a.student.email,
    student_name: a.student.full_name,
    status: a.status,
    started_at: a.started_at,
    submitted_at: a.submitted_at,
    total_score: a.total_score != null ? Number(a.total_score) : null,
    max_score: a.max_score != null ? Number(a.max_score) : null,
    total_time_seconds: a.total_time_seconds,
  }));

  const csv = buildAttemptsCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-attempts.csv"`,
    },
  });
}
