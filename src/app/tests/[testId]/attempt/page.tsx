import { redirect } from "next/navigation";
import { startOrResumeAttempt } from "@/app/actions/attempt";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student" && profile?.role !== "admin") {
    redirect("/login");
  }

  const isRetest = searchParams.retest === "true";

  // No try-catch here to allow Next.js redirects to work naturally
  const bundle = await startOrResumeAttempt(params.testId, isRetest);

  const initial = searchParams.q
    ? { ...bundle, resumeQuestionId: searchParams.q }
    : bundle;

  return (
    <PageShell noPadding>
      <TestTakingClient initial={initial} userRole={profile.role} />
    </PageShell>
  );
}
