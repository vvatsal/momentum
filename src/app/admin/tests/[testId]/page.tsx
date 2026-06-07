import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getTestForAdmin,
  listQuestionsForTest,
  listProfilesForAdmin,
  getTestVisibilityForAdmin,
} from "@/lib/supabase/queries";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { TestMetadataForm } from "@/components/admin/test-metadata-form";
import { QuestionEditor } from "@/components/admin/question-editor";
import { TestPublishPanel } from "@/components/admin/test-publish-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditTestPage({
  params,
}: {
  params: { testId: string };
}) {
  await requireProfile("admin");
  const supabaseAdmin = createAdminClient();
  const test = await getTestForAdmin(supabaseAdmin, params.testId);

  if (!test) notFound();

  const [questions, allProfiles, visibility] = await Promise.all([
    listQuestionsForTest(supabaseAdmin, params.testId),
    listProfilesForAdmin(supabaseAdmin),
    getTestVisibilityForAdmin(supabaseAdmin, params.testId),
  ]);

  const students = allProfiles.filter((p) => p.role === "student");

  return (
    <PageShell noPadding>
      <AppHeader title={test.title} homeHref="/admin" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6 sm:max-w-2xl lg:max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">← Admin</Link>
          </Button>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
            {test.status}
          </span>
          {(test.status === "published" || test.status === "archived") && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/tests/${test.id}/reports`}>Reports</Link>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test details</CardTitle>
            <CardDescription>Instructions, schedule, duration</CardDescription>
          </CardHeader>
          <CardContent>
            <TestMetadataForm test={test} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionEditor
              testId={test.id}
              questions={questions}
              isLocked={test.is_locked}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publish</CardTitle>
          </CardHeader>
          <CardContent>
            <TestPublishPanel
              testId={test.id}
              status={test.status}
              questionCount={test.question_count}
              isLocked={test.is_locked}
              students={students}
              initialSelectedStudentIds={visibility}
            />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
