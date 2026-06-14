import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { countStudents, listTestsForAdmin, listProfilesForAdmin, listAllAttemptsForAdmin } from "@/lib/supabase/queries";
import { getNotes } from "@/app/actions/notes";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const profile = await requireProfile("admin-or-teacher");
  const supabaseAdmin = createAdminClient();

  const isTeacher = profile.role === "teacher";
  const teacherId = isTeacher ? profile.id : undefined;

  const [studentCount, tests, profiles, attempts, notes] = await Promise.all([
    countStudents(supabaseAdmin, teacherId),
    listTestsForAdmin(supabaseAdmin, teacherId),
    listProfilesForAdmin(supabaseAdmin, teacherId),
    listAllAttemptsForAdmin(supabaseAdmin, teacherId),
    getNotes(),
  ]);

  return (
    <PageShell noPadding>
      <AppHeader
        title="Admin"
        subtitle={profile.full_name ?? profile.email}
        homeHref="/admin"
      />
      <div className="mx-auto max-w-lg px-4 py-6 sm:max-w-2xl lg:max-w-4xl">
        <AdminDashboardClient
          profile={profile}
          studentCount={studentCount}
          tests={tests}
          profiles={profiles}
          attempts={attempts}
          notes={notes}
        />
      </div>
    </PageShell>
  );
}

