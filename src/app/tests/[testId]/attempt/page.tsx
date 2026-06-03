import { redirect } from "next/navigation";
import { startOrResumeAttempt } from "@/app/actions/attempt";
import { requireProfile } from "@/lib/auth/session";
import { PageShell } from "@/components/layout/page-shell";
import { TestTakingClient } from "@/components/test/test-taking-client";

export const dynamic = "force-dynamic";

export default async function TestAttemptPage({
  params,
  searchParams,
}: {
  params: { testId: string };
  searchParams: { q?: string; retest?: string };
}) {
  const profile = await requireProfile();
  if (profile.role !== "student" && profile.role !== "admin") {
    redirect("/login");
  }

  const isRetest = searchParams.retest === "true";
  const bundle = await startOrResumeAttempt(params.testId, isRetest);

  if (bundle.attempt.status === "submitted" && !isRetest) {
    redirect(`/tests/${params.testId}/summary`);
  }

  const initial = searchParams.q
    ? { ...bundle, resumeQuestionId: searchParams.q }
    : bundle;

  return (
    <PageShell noPadding>
      <TestTakingClient initial={initial} userRole={profile.role} />
    </PageShell>
  );
}
