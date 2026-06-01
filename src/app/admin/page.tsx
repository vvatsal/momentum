import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { countStudents, listTestsForAdmin } from "@/lib/supabase/queries";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const profile = await requireProfile("admin");
  const supabase = await createClient();

  const [studentCount, tests] = await Promise.all([
    countStudents(supabase),
    listTestsForAdmin(supabase),
  ]);

  return (
    <PageShell noPadding>
      <AppHeader
        title="Admin"
        subtitle={profile.full_name ?? profile.email}
        homeHref="/admin"
      />
      <div className="mx-auto max-w-lg space-y-5 px-4 py-6 sm:max-w-2xl lg:max-w-4xl">
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <Card className="card-hover overflow-hidden">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Students
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold tabular-nums gradient-text">
                {studentCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="card-hover overflow-hidden">
            <CardHeader className="pb-2">
              <CardDescription>Tests</CardDescription>
              <CardTitle className="text-3xl font-extrabold tabular-nums gradient-text">
                {tests.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Button className="w-full sm:w-auto" size="lg" asChild>
          <Link href="/admin/tests/new">
            <Plus className="h-4 w-4" />
            Create new test
          </Link>
        </Button>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="text-base">All tests</CardTitle>
            <CardDescription>Tap to edit or view reports</CardDescription>
          </CardHeader>
          <CardContent>
            {tests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tests yet. Create your first test above.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {tests.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 py-3.5 first:pt-0 last:pb-0"
                  >
                    <Link
                      href={`/admin/tests/${t.id}`}
                      className="min-w-0 flex-1 font-medium transition-colors hover:text-cyan-400"
                    >
                      {t.title}
                    </Link>
                    <span className="flex shrink-0 items-center gap-2">
                      {(t.status === "published" ||
                        t.status === "archived") && (
                        <Link
                          href={`/admin/tests/${t.id}/reports`}
                          className="text-xs font-medium text-cyan-400/80 hover:text-cyan-300"
                        >
                          Reports
                        </Link>
                      )}
                      <Badge
                        variant={
                          t.status === "published"
                            ? "success"
                            : t.status === "draft"
                              ? "muted"
                              : "secondary"
                        }
                      >
                        {t.status}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
