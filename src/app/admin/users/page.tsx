import { requireProfile } from "@/lib/auth/session";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { CreateUserForm } from "@/components/admin/create-user-form";

export default async function AdminUsersPage() {
    const profile = await requireProfile("admin");

    return (
        <PageShell noPadding>
            <AppHeader
                title="User Management"
                subtitle={profile.full_name ?? profile.email}
                homeHref="/admin"
            />
            <div className="mx-auto max-w-lg px-4 py-6 sm:max-w-2xl">
                <CreateUserForm />
            </div>
        </PageShell>
    );
}
