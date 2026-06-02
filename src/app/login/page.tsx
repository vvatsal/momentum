import Link from "next/link";
import { LoginPanel } from "@/components/auth/login-panel";
import { SupabaseConfigAlert } from "@/components/auth/supabase-config-alert";
import { PageShell } from "@/components/layout/page-shell";

type SearchParams = { next?: string; error?: string };

export default async function StudentLoginPage({
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
            Sign in to <span className="gradient-text">Momentum</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email to access your account
          </p>
        </div>
        <SupabaseConfigAlert />
        {params.error === "auth" && (
          <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Sign in link expired or invalid. Try again.
          </p>
        )}
        <LoginPanel mode="student" redirectTo={params.next} />
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
