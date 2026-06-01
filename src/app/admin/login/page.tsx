import Link from "next/link";
import { LoginPanel } from "@/components/auth/login-panel";
import { SupabaseConfigAlert } from "@/components/auth/supabase-config-alert";
import { PageShell } from "@/components/layout/page-shell";

type SearchParams = { next?: string };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams | Promise<SearchParams>;
}) {
  const params = await Promise.resolve(searchParams);

  return (
    <PageShell centered className="justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black tracking-tight">
            Admin <span className="gradient-text">console</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Email and password only
          </p>
        </div>
        <SupabaseConfigAlert />
        <LoginPanel mode="admin" redirectTo={params.next ?? "/admin"} />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link
            href="/"
            className="font-semibold text-cyan-400 hover:text-cyan-300"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
