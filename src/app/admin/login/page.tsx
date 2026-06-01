import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { SupabaseConfigAlert } from "@/components/auth/supabase-config-alert";
import { PageShell } from "@/components/layout/page-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SearchParams = { next?: string };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams | Promise<SearchParams>;
}) {
  const params = await Promise.resolve(searchParams);

  return (
    <PageShell centered className="justify-center py-8">
      <div className="mx-auto w-full max-w-sm animate-slide-up">
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Admin sign in</CardTitle>
            <CardDescription>Email and password only.</CardDescription>
          </CardHeader>
          <CardContent>
            <SupabaseConfigAlert />
            <LoginForm mode="admin" redirectTo={params.next ?? "/admin"} />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link
                href="/"
                className="font-medium text-cyan-400 hover:text-cyan-300"
              >
                ← Back to home
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
