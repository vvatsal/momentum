import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { TestList, type DashboardTest } from "@/components/dashboard/test-list";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { StudentBottomNav } from "@/components/layout/student-bottom-nav";
import { getNotes } from "@/app/actions/notes";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FileText, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export default async function StudentDashboardPage({
  searchParams,
}: {
  searchParams: { tab?: string } | Promise<{ tab?: string }>;
}) {
  const params = await Promise.resolve(searchParams);
  const activeTab = params.tab === "notes" ? "notes" : "tests";

  const profile = await requireProfile("student");
  const supabase = await createClient();

  const [testsRes, attemptsRes, notesRes] = await Promise.all([
    supabase
      .from("tests")
      .select("id, title, description, duration_minutes")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    supabase
      .from("attempts")
      .select("test_id, status")
      .eq("student_id", profile.id),
    getNotes(),
  ]);

  const tests = (testsRes.data ?? []) as TestRow[];
  const attempts = (attemptsRes.data ?? []) as AttemptRow[];
  const notes = notesRes || [];

  const attemptByTest = new Map(attempts.map((a) => [a.test_id, a]));

  const list: DashboardTest[] = tests.map((t) => ({
    ...t,
    attemptStatus: attemptByTest.get(t.id)?.status,
  }));

  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  return (
    <PageShell noPadding>
      <AppHeader
        title={activeTab === "notes" ? "Study Notes" : "My tests"}
        subtitle={profile.full_name ?? profile.email}
        homeHref="/dashboard"
      />
      <div className="mx-auto max-w-lg px-4 pb-28 pt-6 sm:max-w-2xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">Welcome back</p>
          <h1 className="text-2xl font-black tracking-tight">
            Hey, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeTab === "notes"
              ? `${notes.length} note${notes.length === 1 ? "" : "s"} uploaded for you`
              : list.length === 0
                ? "Your tests will appear here when published."
                : `${list.length} test${list.length === 1 ? "" : "s"} ready for you`}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-border pb-3 mb-6">
          <Link
            href="/dashboard?tab=tests"
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all",
              activeTab === "tests"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <FileText className="h-4 w-4" />
            <span>Assessments</span>
          </Link>
          <Link
            href="/dashboard?tab=notes"
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all",
              activeTab === "notes"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <BookOpen className="h-4 w-4" />
            <span>Notes</span>
          </Link>
        </div>

        {activeTab === "tests" ? (
          <TestList tests={list} />
        ) : (
          <div>
            {notes.length === 0 ? (
              <div className="bento-card flex flex-col items-center px-6 py-16 text-center">
                <BookOpen className="mb-3 h-8 w-8 text-primary/60 animate-pulse" />
                <p className="font-medium">No notes available</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  When your teacher uploads study notes, they will appear here instantly.
                </p>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-1">
                {notes.map((note: any) => (
                  <li key={note.id}>
                    <div className="bento-card group p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={note.file_type === "pdf" ? "default" : "secondary"}>
                              {note.file_type}
                            </Badge>
                          </div>
                          <h2 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                            {note.title}
                          </h2>
                          {note.description && (
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                              {note.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/50 pt-4">
                        {note.profiles?.full_name ? (
                          <span className="text-xs text-muted-foreground">
                            Uploaded by {note.profiles.full_name}
                          </span>
                        ) : (
                          <span />
                        )}
                        <Button asChild size="sm" className="shine-btn rounded-xl px-5 h-9 font-semibold">
                          <Link href={`/notes/${note.id}`}>
                            Read Note
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <StudentBottomNav />
    </PageShell>
  );
}
