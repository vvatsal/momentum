import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { TestListItem } from "@/types/database";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const profile = await requireProfile("admin");
  const supabase = await createClient();

  const [{ count: studentCount }, { data: testsData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student"),
    supabase
      .from("tests")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const tests = (testsData ?? []) as TestListItem[];

  return (
    <div className="min-h-dvh">
      <AppHeader
        title="Admin"
        subtitle={profile.full_name ?? profile.email}
        homeHref="/admin"
      />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6 sm:max-w-2xl lg:max-w-4xl">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Students</CardDescription>
              <CardTitle className="text-2xl">{studentCount ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tests</CardDescription>
              <CardTitle className="text-2xl">{tests?.length ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <p className="text-sm text-muted-foreground">
          Test creation and reports arrive in Phases 3–4.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All tests</CardTitle>
          </CardHeader>
          <CardContent>
            {!tests?.length ? (
              <p className="text-sm text-muted-foreground">No tests yet.</p>
            ) : (
              <ul className="divide-y">
                {tests.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <span className="font-medium">{t.title}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                      {t.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
