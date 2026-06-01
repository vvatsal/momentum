import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import { getAttemptForTest, getTestForStudent } from "@/app/actions/attempt";
import { startTestAction } from "@/app/tests/[testId]/actions";
import { requireProfile } from "@/lib/auth/session";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { StudentBottomNav } from "@/components/layout/student-bottom-nav";
import { TestIntroClient } from "@/components/tests/test-intro-client";
import { Button } from "@/components/ui/button";

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

  const startForm = (
    <form action={startTestAction.bind(null, params.testId)}>
      <Button type="submit" className="w-full shine-btn gap-2" size="lg">
        <Play className="h-5 w-5" />
        {attempt?.status === "in_progress" ? "Resume test" : "Start test"}
      </Button>
    </form>
  );

  return (
    <PageShell noPadding>
      <AppHeader title="Test" homeHref="/dashboard" />
      <div className="mx-auto max-w-lg px-4 py-6 pb-28">
        <TestIntroClient
          testId={params.testId}
          title={test.title}
          description={test.description}
          instructions={test.instructions}
          durationMinutes={test.duration_minutes}
          attemptStatus={attempt?.status}
          startForm={startForm}
        />
      </div>
      <StudentBottomNav />
    </PageShell>
  );
}
