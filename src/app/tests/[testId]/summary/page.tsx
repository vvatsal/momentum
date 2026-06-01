import Link from "next/link";
import { Trophy } from "lucide-react";
import { notFound } from "next/navigation";
import { getSubmittedSummary } from "@/app/actions/attempt";
import { requireProfile } from "@/lib/auth/session";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
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
  const pct =
    attempt.max_score && Number(attempt.max_score) > 0
      ? Math.round(
        (Number(attempt.total_score ?? 0) / Number(attempt.max_score)) * 100
      )
      : 0;

  return (
    <PageShell noPadding>
      <AppHeader title="Results" homeHref="/dashboard" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6 animate-slide-up">
        <Card className="glass-strong overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              {test.title}
            </CardTitle>
            <CardDescription>Submitted — answers are final</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/15 to-violet-500/10 p-4">
                <p className="text-3xl font-extrabold tabular-nums gradient-text">
                  {attempt.total_score ?? 0}/{attempt.max_score ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Score · {pct}%
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-3xl font-extrabold tabular-nums">
                  {formatDuration(attempt.total_time_seconds)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Total time</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {answered} answered · {skipped} skipped ·{" "}
              {questions.length - answered - skipped} unanswered
            </p>
            <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] text-sm">
              {questions.map((q, i) => {
                const r = responses.find((x) => x.question_id === q.id);
                const correct = r?.is_correct;
                return (
                  <li
                    key={q.id}
                    className="flex items-start justify-between gap-2 px-4 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold text-cyan-400/90">
                        Q{i + 1}.
                      </span>{" "}
                      {q.question_text}
                    </span>
                    <span
                      className={`shrink-0 text-xs font-semibold tabular-nums ${correct
                          ? "text-emerald-400"
                          : r?.status === "skipped"
                            ? "text-amber-400"
                            : "text-red-400"
                        }`}
                    >
                      {correct ? "✓" : r?.status === "skipped" ? "—" : "✗"}{" "}
                      {r?.awarded_marks ?? 0}/{q.marks}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full" size="lg">
                <Link href={`/tests/${test.id}/review`}>Review Answers</Link>
              </Button>
              <Button asChild className="w-full" variant="outline" size="lg">
                <Link href="/dashboard">Back to tests</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
