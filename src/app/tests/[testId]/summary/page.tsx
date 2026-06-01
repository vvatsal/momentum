import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubmittedSummary } from "@/app/actions/attempt";
import { requireProfile } from "@/lib/auth/session";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TestSummaryPage({
  params,
}: {
  params: { testId: string };
}) {
  await requireProfile("student");
  const data = await getSubmittedSummary(params.testId);

  if (!data?.test || !data.attempt) notFound();

  const { test, attempt, questions, responses } = data;
  const answered = responses.filter((r) => r.status === "answered").length;
  const skipped = responses.filter((r) => r.status === "skipped").length;

  return (
    <div className="min-h-dvh">
      <AppHeader title="Results" homeHref="/dashboard" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>{test.title}</CardTitle>
            <CardDescription>Submitted — you cannot edit answers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-2xl font-bold">
                  {attempt.total_score ?? 0}/{attempt.max_score ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-2xl font-bold">
                  {formatDuration(attempt.total_time_seconds)}
                </p>
                <p className="text-xs text-muted-foreground">Total time</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {answered} answered · {skipped} skipped ·{" "}
              {questions.length - answered - skipped} unanswered
            </p>
            <ul className="divide-y rounded-lg border text-sm">
              {questions.map((q, i) => {
                const r = responses.find((x) => x.question_id === q.id);
                return (
                  <li
                    key={q.id}
                    className="flex items-start justify-between gap-2 px-3 py-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">Q{i + 1}.</span>{" "}
                      {q.question_text}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {r?.is_correct ? "✓" : r?.status === "skipped" ? "—" : "✗"}{" "}
                      {r?.awarded_marks ?? 0}/{q.marks}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Button asChild className="w-full">
              <Link href="/dashboard">Back to tests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
