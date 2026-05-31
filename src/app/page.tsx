import Link from "next/link";
import { GraduationCap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12 sm:max-w-2xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Momentum</h1>
          <p className="mt-2 text-muted-foreground">
            Online tests built for phones — timed questions, auto-save, and instant scoring.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-5 w-5 text-primary" />
                Student
              </CardTitle>
              <CardDescription>
                Sign in with magic link or password to take published tests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login">Student login</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-primary" />
                Admin
              </CardTitle>
              <CardDescription>
                Create tests, publish papers, and view attempt reports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/login">Admin login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Phase 1 — Auth &amp; roles ready
      </footer>
    </main>
  );
}
