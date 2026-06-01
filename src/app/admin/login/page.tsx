import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { SupabaseConfigAlert } from "@/components/auth/supabase-config-alert";
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
    <main className="flex min-h-dvh flex-col justify-center px-4 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Admin sign in</CardTitle>
            <CardDescription>Email and password only.</CardDescription>
          </CardHeader>
          <CardContent>
            <SupabaseConfigAlert />
            <LoginForm
              mode="admin"
              redirectTo={params.next ?? "/admin"}
            />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/" className="text-primary hover:underline">
                Back to home
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
