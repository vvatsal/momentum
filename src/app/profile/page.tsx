import { requireProfile } from "@/lib/auth/session";
import { ProfileClient } from "@/components/profile/profile-client";
import { PageShell } from "@/components/layout/page-shell";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await requireProfile();

  return (
    <PageShell noPadding>
      <ProfileClient profile={profile} />
    </PageShell>
  );
}
