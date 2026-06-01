import Link from "next/link";
import { ArrowRight, GraduationCap, Shield, Sparkles, Zap } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LandingPage() {
  return (
    <PageShell centered className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-12">
        <div className="mb-12 animate-fade-in text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-violet-600 shadow-glow">
            <Zap className="h-8 w-8 text-white" strokeWidth={2.5} />
          </div>
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Built for speed on any device
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            <span className="gradient-text">Momentum</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            Timed exams with instant saves, question palette, and scoring the
            moment you submit.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="card-hover animate-slide-up animate-stagger-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
                  <GraduationCap className="h-5 w-5" />
                </span>
                Student
              </CardTitle>
              <CardDescription>
                Magic link or password. Take published tests on mobile or desktop.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="group w-full" size="lg">
                <Link href="/login">
                  Student login
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover animate-slide-up animate-stagger-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                  <Shield className="h-5 w-5" />
                </span>
                Admin
              </CardTitle>
              <CardDescription>
                Create tests, publish to students, export reports and CSV.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="group w-full" size="lg">
                <Link href="/admin/login">
                  Admin login
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-5 text-center text-xs text-muted-foreground">
        Momentum — online exams
      </footer>
    </PageShell>
  );
}
