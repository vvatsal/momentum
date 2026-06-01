import Link from "next/link";
import { notFound } from "next/navigation";
import { getAttemptForTest, getTestForStudent } from "@/app/actions/attempt";
import { startTestAction } from "@/app/tests/[testId]/actions";
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

export const dynamic = "force-dynamic";

export default async function TestInstructionsPage({
  params,
}: {
  params: { testId: string };
}) {
  await requireProfile("student");
  const test = await getTestForStudent(params.testId);

  if (!test) notFound();

  const attempt = await getAttemptForTest(params.testId);

  return (
    <div className="min-h-dvh">
      <AppHeader title="Test" homeHref="/dashboard" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>{test.title}</CardTitle>
            {test.description && (
              <CardDescription>{test.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {test.instructions && (
              <div className="rounded-lg bg-muted p-3 whitespace-pre-wrap">
                {test.instructions}
              </div>
            )}
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>One question at a time — use the grid to jump</li>
              <li>Answers auto-save when you move between questions</li>
              <li>You can exit and resume later until final submit</li>
              {test.duration_minutes && (
                <li>Suggested time: {test.duration_minutes} minutes</li>
              )}
            </ul>

            {attempt?.status === "submitted" ? (
              <Button asChild className="w-full">
                <Link href={`/tests/${params.testId}/summary`}>
                  View results
                </Link>
              </Button>
            ) : attempt?.status === "in_progress" ? (
              <form action={startTestAction.bind(null, params.testId)}>
                <Button type="submit" className="w-full">
                  Resume test
                </Button>
              </form>
            ) : (
              <form action={startTestAction.bind(null, params.testId)}>
                <Button type="submit" className="w-full">
                  Start test
                </Button>
              </form>
            )}

            <Button asChild variant="ghost" className="w-full">
              <Link href="/dashboard">Back to tests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
