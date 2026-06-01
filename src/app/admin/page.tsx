import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { countStudents, listTestsForAdmin } from "@/lib/supabase/queries";
import { AppHeader } from "@/components/layout/app-header";
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
    <div className="min-h-dvh">
      <AppHeader
        title="Admin"
        subtitle={profile.full_name ?? profile.email}
        homeHref="/admin"
      />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6 sm:max-w-2xl lg:max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          <div className="grid flex-1 grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Students</CardDescription>
                <CardTitle className="text-2xl">{studentCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tests</CardDescription>
                <CardTitle className="text-2xl">{tests.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>

        <Button className="w-full sm:w-auto" asChild>
          <Link href="/admin/tests/new">Create new test</Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All tests</CardTitle>
            <CardDescription>Tap a test to edit or view reports</CardDescription>
          </CardHeader>
          <CardContent>
            {tests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tests yet. Create your first test above.
              </p>
            ) : (
              <ul className="divide-y">
                {tests.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 py-3 text-sm"
                  >
                    <Link
                      href={`/admin/tests/${t.id}`}
                      className="min-w-0 flex-1 font-medium hover:underline"
                    >
                      {t.title}
                    </Link>
                    <span className="flex shrink-0 items-center gap-2">
                      {(t.status === "published" ||
                        t.status === "archived") && (
                        <Link
                          href={`/admin/tests/${t.id}/reports`}
                          className="text-xs text-primary underline"
                        >
                          Reports
                        </Link>
                      )}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                        {t.status}
                      </span>
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
