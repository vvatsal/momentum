import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <div className="min-h-dvh">
      <AppHeader
        title="My tests"
        subtitle={profile.full_name ?? profile.email}
        homeHref="/dashboard"
      />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6 sm:max-w-2xl">
        {tests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No tests available yet. Check back after your teacher publishes one.
            </CardContent>
          </Card>
        ) : (
          tests.map((test) => {
            const attempt = attemptByTest.get(test.id);
            return (
              <Card key={test.id}>
                <CardHeader>
                  <CardTitle className="text-base">{test.title}</CardTitle>
                  {test.description && (
                    <CardDescription>{test.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {test.duration_minutes
                      ? `${test.duration_minutes} min suggested`
                      : "No time limit"}
                    {attempt?.status === "in_progress" && " · In progress"}
                    {attempt?.status === "submitted" && " · Completed"}
                  </p>
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/tests/${test.id}`}>
                      {attempt?.status === "submitted"
                        ? "View results"
                        : attempt?.status === "in_progress"
                          ? "Resume"
                          : "Open test"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
