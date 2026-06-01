import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth/session";
import { buildAttemptsCsv, type AttemptReportRow } from "@/lib/reports/csv";
import { createClient } from "@/lib/supabase/server";
import { listAttemptsForTest, getTestForAdmin } from "@/lib/supabase/queries";

export async function GET(
  _request: Request,
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

  const attempts = await listAttemptsForTest(supabase, params.testId);

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
  const slug = test.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-attempts.csv"`,
    },
  });
}
