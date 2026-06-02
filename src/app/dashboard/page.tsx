import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { TestList, type DashboardTest } from "@/components/dashboard/test-list";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { StudentBottomNav } from "@/components/layout/student-bottom-nav";
import { ChangePassword } from "@/components/auth/change-password";

export const dynamic = "force-dynamic";

type TestRow = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
};

type AttemptRow = {
  test_id: string;
  status: string;
};

export default async function StudentDashboardPage() {
  const profile = await requireProfile("student");
  const supabase = await createClient();

  const { data: testsData } = await supabase
    .from("tests")
    .select("id, title, description, duration_minutes")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const tests = (testsData ?? []) as TestRow[];

  const { data: attemptsData } = await supabase
    .from("attempts")
    .select("test_id, status")
    .eq("student_id", profile.id);

  const attempts = (attemptsData ?? []) as AttemptRow[];
  const attemptByTest = new Map(attempts.map((a) => [a.test_id, a]));

  const list: DashboardTest[] = tests.map((t) => ({
    ...t,
    attemptStatus: attemptByTest.get(t.id)?.status,
  }));

  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  return (
    <PageShell noPadding>
      <AppHeader
        title="My tests"
        subtitle={profile.full_name ?? profile.email}
        homeHref="/dashboard"
      />
      <div className="mx-auto max-w-lg px-4 pb-28 pt-6 sm:max-w-2xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-cyan-400/90">Welcome back</p>
          <h1 className="text-2xl font-black tracking-tight">
            Hey, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length === 0
              ? "Your tests will appear here when published."
              : `${list.length} test${list.length === 1 ? "" : "s"} ready for you`}
          </p>
        </div>
        <TestList tests={list} />
        <div className="mt-12">
          <ChangePassword />
        </div>
      </div>
      <StudentBottomNav />
    </PageShell>
  );
}
