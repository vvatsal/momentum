import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { countStudents, listTestsForAdmin, listProfilesForAdmin, listAllAttemptsForAdmin } from "@/lib/supabase/queries";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const profile = await requireProfile("admin");
  const supabase = await createClient();

  const [studentCount, tests, profiles, attempts] = await Promise.all([
    countStudents(supabase),
    listTestsForAdmin(supabase),
    listProfilesForAdmin(supabase),
    listAllAttemptsForAdmin(supabase),
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
          studentCount={studentCount}
          tests={tests}
          profiles={profiles}
          attempts={attempts}
        />
      </div>
    </PageShell>
  );
}

