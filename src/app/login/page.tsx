import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StudentLoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
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
            {searchParams.error === "auth" && (
              <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Sign in link expired or invalid. Try again.
              </p>
            )}
            <LoginForm mode="student" redirectTo={searchParams.next} />
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
