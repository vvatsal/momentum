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

type SearchParams = { next?: string; error?: string };

export default async function StudentLoginPage({
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
            <CardTitle>Student sign in</CardTitle>
            <CardDescription>
              Use your school email. Magic link or password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupabaseConfigAlert />
            {params.error === "auth" && (
              <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Sign in link expired or invalid. Try again.
              </p>
            )}
            <LoginForm mode="student" redirectTo={params.next} />
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
