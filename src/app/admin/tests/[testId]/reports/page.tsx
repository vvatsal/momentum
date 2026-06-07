import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  getTestForAdmin,
  listAttemptsForTest,
  listEmailLogForTest,
  listQuestionsForTest,
  listResponsesForTest,
} from "@/lib/supabase/queries";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { TestReportsClient } from "@/components/admin/test-reports-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TestReportsPage({
  params,
}: {
  params: { testId: string };
}) {
  const profile = await requireProfile("admin-or-teacher");
  const supabase = await createClient();
  const test = await getTestForAdmin(supabase, params.testId);

  if (!test) notFound();

  // Teachers can only view reports for tests they created
  if (profile.role === "teacher" && test.created_by !== profile.id) {
    redirect("/admin");
  }

  const [attempts, emailLog, questions, responses] = await Promise.all([
    listAttemptsForTest(supabase, params.testId),
    listEmailLogForTest(supabase, params.testId),
    listQuestionsForTest(supabase, params.testId),
    listResponsesForTest(supabase, params.testId),
  ]);

  // If teacher, filter attempts and responses to only show their own students
  let filteredAttempts = attempts;
  let filteredResponses = responses;
  
  if (profile.role === "teacher") {
    const { data: students } = await supabase
      .from("profiles")
      .select("id")
      .eq("created_by", profile.id);
      
    const teacherStudentIds = (students ?? []).map((s) => s.id);
    filteredAttempts = attempts.filter((a) => teacherStudentIds.includes(a.student_id));
    
    const attemptIds = filteredAttempts.map((a) => a.id);
    filteredResponses = responses.filter((r: any) => attemptIds.includes(r.attempt_id));
  }

  const submitted = filteredAttempts.filter((a) => a.status === "submitted");

  return (
    <PageShell noPadding>
      <AppHeader title={`Reports: ${test.title}`} homeHref="/admin" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6 sm:max-w-2xl lg:max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/admin/tests/${test.id}`}>← Edit test</Link>
            </Button>
            <Button size="sm" asChild className="shine-btn font-bold">
              <a href={`/admin/tests/${test.id}/export`} download>
                Download Attempts CSV
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild className="border-white/10 hover:bg-white/5 font-bold">
              <a href={`/admin/tests/${test.id}/export?type=responses`} download>
                Download Responses CSV
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="glass-strong">
            <CardHeader className="pb-2 p-4">
              <CardDescription className="text-xs uppercase font-bold text-muted-foreground/60">Attempts</CardDescription>
              <CardTitle className="text-2xl font-black gradient-text">{filteredAttempts.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-strong">
            <CardHeader className="pb-2 p-4">
              <CardDescription className="text-xs uppercase font-bold text-muted-foreground/60">Submitted</CardDescription>
              <CardTitle className="text-2xl font-black text-green-400">{submitted.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-strong">
            <CardHeader className="pb-2 p-4">
              <CardDescription className="text-xs uppercase font-bold text-muted-foreground/60">In progress</CardDescription>
              <CardTitle className="text-2xl font-black text-yellow-400">
                {filteredAttempts.length - submitted.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <TestReportsClient
          test={test}
          questions={questions}
          attempts={filteredAttempts}
          responses={filteredResponses}
        />

        {emailLog.length > 0 && profile.role !== "teacher" && (
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="text-base">Publish emails</CardTitle>
              <CardDescription>Notification log from Resend</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-white/[0.04] text-sm">
                {emailLog.slice(0, 20).map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <span className="truncate">{e.recipient_email}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${e.status === "sent"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : e.status === "failed"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {e.status}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
