import { redirect } from "next/navigation";
import { startOrResumeAttempt } from "@/app/actions/attempt";
import { requireProfile } from "@/lib/auth/session";
import { TestTakingClient } from "@/components/test/test-taking-client";

export const dynamic = "force-dynamic";

export default async function TestAttemptPage({
  params,
  searchParams,
}: {
  params: { testId: string };
  searchParams: { q?: string };
}) {
  await requireProfile("student");

  const bundle = await startOrResumeAttempt(params.testId);

  if (bundle.attempt.status === "submitted") {
    redirect(`/tests/${params.testId}/summary`);
  }

  const initial = searchParams.q
    ? { ...bundle, resumeQuestionId: searchParams.q }
    : bundle;

  return <TestTakingClient initial={initial} />;
}
