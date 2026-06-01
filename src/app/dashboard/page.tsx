import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { PublishedTestListItem } from "@/types/database";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function StudentDashboardPage() {
  const profile = await requireProfile("student");
  const supabase = await createClient();

  const { data: testsData } = await supabase
    .from("tests")
    .select("id, title, description, starts_at, ends_at, duration_minutes")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const tests = (testsData ?? []) as PublishedTestListItem[];

  return (
    <div className="min-h-dvh">
      <AppHeader
        title="My tests"
        subtitle={profile.full_name ?? profile.email}
        homeHref="/dashboard"
      />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6 sm:max-w-2xl">
        <p className="text-sm text-muted-foreground">
          Published tests available to you. Test-taking flow arrives in Phase 2.
        </p>

        {!tests?.length ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No tests available yet. Check back after your teacher publishes one.
            </CardContent>
          </Card>
        ) : (
          tests.map((test) => (
            <Card key={test.id}>
              <CardHeader>
                <CardTitle className="text-base">{test.title}</CardTitle>
                {test.description && (
                  <CardDescription>{test.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {test.duration_minutes
                  ? `${test.duration_minutes} min allowed`
                  : "No time limit"}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
