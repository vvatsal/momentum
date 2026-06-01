import Link from "next/link";
import { Clock, PlayCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
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
    <PageShell noPadding>
      <AppHeader
        title="My tests"
        subtitle={profile.full_name ?? profile.email}
        homeHref="/dashboard"
      />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6 sm:max-w-2xl">
        {tests.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No tests available yet. Check back after your teacher publishes
                one.
              </p>
            </CardContent>
          </Card>
        ) : (
          tests.map((test, i) => {
            const attempt = attemptByTest.get(test.id);
            const status = attempt?.status;
            return (
              <Card
                key={test.id}
                className={`card-hover animate-slide-up`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">
                      {test.title}
                    </CardTitle>
                    {status === "in_progress" && (
                      <Badge variant="warning">In progress</Badge>
                    )}
                    {status === "submitted" && (
                      <Badge variant="success">Done</Badge>
                    )}
                    {!status && <Badge variant="muted">New</Badge>}
                  </div>
                  {test.description && (
                    <CardDescription className="line-clamp-2">
                      {test.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {test.duration_minutes
                      ? `${test.duration_minutes} min suggested`
                      : "No time limit"}
                  </p>
                  <Button asChild className="w-full group" size="lg">
                    <Link href={`/tests/${test.id}`}>
                      <PlayCircle className="h-4 w-4" />
                      {status === "submitted"
                        ? "View results"
                        : status === "in_progress"
                          ? "Resume test"
                          : "Start test"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </PageShell>
  );
}
