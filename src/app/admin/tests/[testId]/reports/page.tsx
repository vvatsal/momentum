import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { formatDuration } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  getTestForAdmin,
  listAttemptsForTest,
  listEmailLogForTest,
} from "@/lib/supabase/queries";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
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
  await requireProfile("admin");
  const supabase = await createClient();
  const test = await getTestForAdmin(supabase, params.testId);

  if (!test) notFound();

  const [attempts, emailLog] = await Promise.all([
    listAttemptsForTest(supabase, params.testId),
    listEmailLogForTest(supabase, params.testId),
  ]);

  const submitted = attempts.filter((a) => a.status === "submitted");

  return (
    <PageShell noPadding>
      <AppHeader title={`Reports: ${test.title}`} homeHref="/admin" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6 sm:max-w-2xl lg:max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/tests/${test.id}`}>← Edit test</Link>
          </Button>
          <Button size="sm" asChild>
            <a href={`/admin/tests/${test.id}/export`} download>
              Download CSV
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Attempts</CardDescription>
              <CardTitle className="text-2xl">{attempts.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Submitted</CardDescription>
              <CardTitle className="text-2xl">{submitted.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In progress</CardDescription>
              <CardTitle className="text-2xl">
                {attempts.length - submitted.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attempts</CardTitle>
            <CardDescription>
              Scores shown after final submit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attempts yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2 pr-2 font-medium">Student</th>
                      <th className="py-2 pr-2 font-medium">Status</th>
                      <th className="py-2 pr-2 font-medium">Score</th>
                      <th className="py-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a) => (
                      <tr key={a.id} className="border-b">
                        <td className="py-2 pr-2">
                          <div className="font-medium">
                            {a.student.full_name ?? a.student.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {a.student.email}
                          </div>
                        </td>
                        <td className="py-2 pr-2 capitalize">{a.status}</td>
                        <td className="py-2 pr-2">
                          {a.status === "submitted" &&
                          a.total_score != null &&
                          a.max_score != null
                            ? `${a.total_score} / ${a.max_score}`
                            : "—"}
                        </td>
                        <td className="py-2">
                          {formatDuration(a.total_time_seconds)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {emailLog.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publish emails</CardTitle>
              <CardDescription>Notification log from Resend</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {emailLog.slice(0, 20).map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <span className="truncate">{e.recipient_email}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                        e.status === "sent"
                          ? "bg-green-100 text-green-800"
                          : e.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-muted"
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
